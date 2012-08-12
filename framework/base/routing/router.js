var Route       = require('./route');
var fs          = require('fs');
var path        = require('path');
var qs          = require('querystring');


module.exports = Router.inherits( autodafe.AppModule );


/**
 * Router занимается маршрутизацией запросов и созданием URL
 *
 * Router настраивается в секции router конфигурационного файла. Обратиться к роутеру приложения можно через
 * {@link Application.router}
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params см. {@link Router._init}
 * @example Настройка роутера конфигурационном файле
 * <pre><code class="javascript">
 * var config = module.exports = {
 *   base_dir        : __dirname,
 *   name            : 'AppName',
 *
 *   router : {
 *     rules : {
 *       // ...
 *     }
 *   }
 * }
 * </code></pre>
 */
function Router( params ) {
  this._init( params );
}


/**
 * Инициализация Router
 *
 * @private
 * @param {Object} params параметры для инициализации роутера, см. также {@link AppModule._init}
 * @param {Object} [params.rules={}] правила маршрутизации запросов
 *
 * Ключи rules соответствуют части url адреса, которая идет после названия хоста и до параметров запроса в HTTP запросе
 * и свойству action действия пришедшего по websockets. Внутри пути могут быть описаны параметры в виде
 * <param_name:param_pattern> где param_name - имя параметра, а param_pattern - регулярное выражение соответствующее
 * данному параметру. Также перед путем разделяя пробелами можно указать фильтры в виде filter_name:filter_value, где
 * filter_name - часть распаршенного url, (см. <a href="http://nodejs.org/docs/latest/api/url.html#url.parse">url.parse</a>)
 * а filter_value значение которое должно соответствовать части url. filter_name по умолчанию равно 'hostname'
 *
 * Значения rules - пути к действиям в виде 'контроллер.действие'. Если указать только контроллер: 'контроллер' - в
 * качестве действия будет взято {@link Controller.default_action} этого контроллера, если указать пустую строку,
 * будет взят {@link Application.default_controller}. После вертикально слэша можно указать методы и протоколы, по
 * каоторым будет работать запрос: post, get, update, http (включает в себя первые 3), ws (WebSockets)
 *
 * @example Таблица маршрутизации
 * <pre><code class="javascript">
 * router : {
 *   rules : {
 *     ''                    : 'site.index',
 *     'posts'               : 'site.show_posts',
 *     'post/<post_id:\\d+>' : 'site.show_post',
 *     'delete_post'         : 'site.delete_post | post, delete',
 *
 *     'm.example.com /'                          : 'mobile.index',
 *     'hostname:m.example.com port:3000 /posts'  : 'mobile.show_posts'
 *   }
 * }
 * </code></pre>
 *
 */
Router.prototype._init = function ( params ) {
  Router.parent._init.call( this, params );

  /**
   * Правила маршрутизации
   *
   * @private
   * @type {Route[]}
   */
  this._routes         = [];

  /**
   * Правила маршрутизации индексированные по пути к действию
   *
   * Используются для создания URL {@link Router.create_url}. Ключи - пути вида 'контроллер.действие', значения -
   * массивы маршрутов {@link Route}
   *
   * @private
   * @type {Object}
   */
  this._routes_by_path = {};

  /**
   * Контроллеры
   *
   * Ключи - название контроллеров, значения - инициализиованные контроллеры {@link Controller}
   *
   * @private
   * @type {Object}
   */
  this._controllers    = {};

  /**
   * Регулярное выражение пути до действия контроллера
   *
   * Карманы: 3 - название контроллера или undefined, 4 - название действия или undefined
   */
  this._route_path_re  = /^(((\w+)\.)?(\w+))?$/;

  this._collect_controllers();
  this._parse_route_paths( params.rules );
};


/**
 * Строит таблицу маршрутизации
 *
 * @param {Object} rules пути, описание см. в {@link Router._init}
 */
Router.prototype._parse_route_paths = function ( rules ) {
  for ( var rule in rules ) this.add_rule( rule, rules[ rule ] );
};


/**
 * Добавляет правило в таблицу маршрутизации
 *
 * @since 0.2.2
 * @param {String} route_path путь, который необходимо перенаправить
 * @param {String} path_to_action путь до действия контроллера
 * @example Добавление правила
 *
 * <pre><code class="javascript">
 * this.app.router.add_rule( '/path/with/<param:\\w+>', 'controller.action' );
 * </code></pre>
 *
 * @see Router._init
 */
Router.prototype.add_rule = function ( route_path, path_to_action ) {
  var route = new Route( {
    path    : path_to_action,
    rule    : route_path,
    app     : this.app,
    router  : this
  } );

  this._routes.push( route );
  path_to_action = route.path;
  if ( !this._routes_by_path[ path_to_action ] ) this._routes_by_path[ path_to_action ] = [];
  this._routes_by_path[ path_to_action ].push( route );
};


/**
 * Собирает и инициализирует контроллеры
 *
 * Контроллеры ищутся в {@link Application.path_to_controllers}
 *
 * @private
 * @see Router.add_controller
 */
Router.prototype._collect_controllers = function () {
  var controllers_path = this.app.path_to_controllers;
  this.log( 'Collecting controllers in path: ' + controllers_path, 'trace' );

  var files = null;
  try {
    files = fs.readdirSync( controllers_path );
  }
  catch(e){
    this.log( 'Controllers folder is not found. Skip loading controllers', 'warning' );
    return false;
  }

  for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {

    var file        = files[f];
    var file_path   = path.join( controllers_path, file );

    this.add_controller( file_path );
  }

  this.log( 'Controllers are included', 'info' );
};


/**
 * Добавляет контроллер
 *
 * @since 0.2.2
 * @param {String|Controller} controller относительный путь до контроллера от {@link Application.base_dir}, абсолютный
 * путь до контроллера, или конструктор контроллера
 * @param {String} [name] Имя контроллера, этот параметр необязателен если указан путь до контроллера и обязателен
 * если контроллер добавляется по конструктору
 * @throws {Error} если возникнет проблема при подключении файла с контроллером
 * @throws {Error} если возникнет проблема во время инициализации контроллера
 * @throws {Error} если не указано имя контроллера, а в первом аргументе конструктор
 * @throws {Error} если не указан первый аргумент
 * @returns {Boolean} true если контроллер добавлен
 */
Router.prototype.add_controller = function ( controller, name ) {
  if ( !controller ) throw new Error( 'You should specify path to controller or controller constructor in ' +
    'first argument of Router.add_controller' );

  if ( typeof controller == 'string' ) try {
    var file_path = path.resolve( this.app.base_dir, controller );
    name          = name || path.basename( file_path, '.js' );
    controller    = require( file_path );
  }
  catch( e ) {
    this.log( 'Problem while including controller in path `%s`'.format( file_path ), 'error' );
    throw e;
  }

  if ( !autodafe.Controller.is_instantiate( controller.prototype ) ) {
    this.log( 'File in path `%s` is not a controller'.format( file_path ), 'warning' );
    return false;
  }

  if ( !name ) throw new Error(
    'You should set name of controller as second argument in Router.add_controller if you add it by constructor `%s`'
    .format( controller.name )
  );

  try {
    this._controllers[ name ] = new controller({
      app   : this.app,
      name  : name
    });
  }
  catch( e ) {
    this.log( 'Problem while initializing controller `%s`'.format( name ), 'error' );
    throw e;
  }

  this.log( 'Controller "%s" is added'.format( name ), 'trace' );
  return true;
};


/**
 * Перенаправляет запрос
 *
 * @param {Request} query запрос
 * @throws {Error} 404 если не найден подходящий маршрут
 * @throws {Error} 404 если не найден контроллер по наиболее релевантному маршруту
 * @throws {Error} 500 если возникла ошибка при вызове действия контроллера (см. {@link Controller.run_action})
 */
Router.prototype.route = function( query ) {
  var error;

  if ( !this._routes.some( function( route ){
    return route.is_suitable_for( query, true );
  } ) ) {
    error = new Error( ('Route to `{route_rule}` failed. ' +
      'File not found and route not specified in section router.rules of configuration file or ' +
      'specified for other protocol or query type than `{current_ct}`').format( {
        '{route_rule}' : query.action,
        '{current_ct}' : query.type
      })
    );
    error.number = 404;
    throw error;
  }

  var route       = query.route;
  var controller  = this._controllers[ route.controller ];
  if ( !controller ) {
    error = new Error( 'Controller "%s" is not found'.format( route.controller ) );
    error.number = 404;
    throw error;
  }

  this.log( 'Route to `%s`'.format( route.path ), 'trace' );

  try {
    return controller.run_action( route.action, query.params, query.client );
  }
  catch ( e ) {
    e.number = 500;
    throw e;
  }
};


/**
 * Создавет URL пользуясь таблицей маршрутизации
 *
 * Для создания URL из контроллера удобнее пользоваться функцией {@link Controller.create_url}
 *
 * @param {String} route_path путь к действию вида 'контроллер.действие', 'действие' или ''
 * @param {Object} [params={}] параметры для формирования URL
 * @param {String} [default_controller={@link Application.default_controller}] контроллер, который будет использоваться
 * если он не указан в пути
 * @param {String} [default_action=''] действие, которое будет использоваться если оно не указано в пути
 * @returns {String} URL
 */
Router.prototype.create_url = function ( route_path, params, default_controller, default_action ) {
  var matches = this._route_path_re.exec( route_path );
  if ( !matches ) {
    this.log( 'Bad route path `%s`. Route path should be formated as controller.action'.format( route_path ), 'warning' );
    return route_path || '#';
  }

  var controller_name = matches[3] || default_controller || this.app.default_controller;
  var action_name     = matches[4] || default_action     || '';
  route_path          = controller_name + '.' + action_name;

  var routes  = this._routes_by_path[ route_path ];
  if ( !routes ) {
    this.log( 'Routes for route path `%s` are not found'.format( route_path ), 'warning' );
    return route_path || '#';
  }

  var route = routes.filter( function( route ){
    return route.has_params( params );
  } ).sort( function( a, b ){
    return Object.keys( a.rule_params ).length < Object.keys( b.rule_params ).length;
  } )[0];

  if ( !route ) {
    this.log(
      'Can not found exact route for route path `%s`. Check parametres for Router.create_url'.format( route_path ),
      'warning' );
    return '#';
  }

  var query_params = Object.not_deep_clone( params );
  var rule  = route.get_rule( query_params );
  var query = qs.stringify( query_params );

  return '/' + rule + ( query ? '?' + query : '' );
};


/**
 * Возвращает контроллер по имени
 *
 * @param {String} name имя контроллера
 * @returns {Controller}
 */
Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};