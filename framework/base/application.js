var path                  = require('path');
var fs                    = require('fs');
var dust                  = require('dustjs-linkedin');
var Session               = require('./session');
var Router                = require('./routing/router');
var Logger                = require('../logging/logger');
var ComponentsManager     = require('../components/components_manager');
var ModelsManager         = require('./models/models_manager');
var ProxyHandler          = require('../lib/proxy_handlers/proxy_handler.js');
var Validator             = require('./models/validator');

module.exports = Application.inherits( autodafe.AutodafePart );


/**
 * Класс описывающий приложение. Используя его можно обратиться ко всем компонентам, контроллерам, моделям и т.д.
 * Создавать приложение нужно пользуясь {@link Autodafe.create_application} Ссылка на приложение app есть во всех
 * классах унаследованных от {@link AppModule}, таких в фреймворке большинство.
 *
 * @constructor
 * @extends AutodafePart
 * @param {Object} config см. {@link Application._init}
 */
function Application( config ) {
  this._init( config );
}


/**
 * @event
 * @name Application#ready
 * @description Приложение готово к запуску
 *
 * Событие вызывается, когда загружено ядро и все компоненты. После этого приложение начнет запускаться если был вызван
 * {@link Application.run} Если хотите выполнить при инициализированном, но не запущенном приложении используйте это
 * событие
 *
 * @see Application#event:run
 */


/**
 * @event
 * @name Application#core_is_built
 * @description Ядро ( все для работы mvc и компонентов ) загружено и инициализировано
 */


/**
 * @event
 * @name Application#views_are_loaded
 * @description Загружены шаблоны
 *
 * Событие вызывается, когда загружены все вьюшки, если Вам надо делать какие-либо операции каждый раз когда шаблоны
 * перезагружаются, используйте это событие
 */


/**
 * @event
 * @name Application#models_are_loaded
 * @description все модели загружены и проинициализированы
 *
 * В том числе у моделей унаследованных от {@link ActiveRecord} в данный момент будут загружены таблицы соответствующие
 * им
 */


/**
 * @event
 * @name Application#error
 * @description ошибка во время инициализации приложения
 *
 * вместо использования этого события лучше передавать параметр callback в {@link Autodafe.create_application}
 */


/**
 * @event
 * @name Application#router_is_ready
 * @description Маршрутизатор запросов готов, все контроллеры загружены
 */


/**
 * @event
 * @name Application#components_are_loaded
 * @description Все компоненты загружены
 */


/**
 * @event
 * @name Application#run
 * @description Запуск приложения
 *
 * Вызывается во время запуска приложения, после того как {@link Application.is_running} вставлен в true. В это время уже
 * инициализировано ядро приложения и все его компоненты. На это событие обычно вешаются обработчики открывающие
 * приложение для внешнего использования: так, например, во время этого события {@link WebSocketsServer} и
 * {@link HTTPServer} начинают слушать порты, на которые они повешаны, чтобы приходящие запросы уходили уже к полностью
 * работающему приложению.
 *
 * @example Пример использования:
 *
 * допустим у нас есть компонент, который должен что-то делать после того, как приложение полностью проинициализировано.
 *
 * <pre><code class="javascript">
 * module.exports = MyComponent.inherits( autodafe.Component );
 *
 * function MyComponent( params ){
 *   this._init( params );
 * }
 *
 * MyComponent.prototype._init = function( params ) {
 *   MyComponent.parent._init.call( this, params );  // вызываем метод родительского класса
 *
 *   // делаем инициализацию компонента
 *
 *   this.app.on( 'run', this._run.bind( this ) );
 * }
 *
 * MyComponent.prototype._run = function() {
 *   // этот код выполнится после полной инициализации приложения
 * }
 * </code></pre>
 */


/**
 * @event
 * @name Application#new_session
 * @param {Session} session Только что созданная сессия
 * @description Вызывается во время создания новой сессии
 */


/**
 * @event
 * @name Application#stop
 * @description Остановка приложения
 */


// todo: задокументировать более подробно
/**
 * Различные инструменты
 *
 * @type {Object}
 */
Application.prototype.tools = require('../lib/tools');


/**
 * Инициализация Application
 *
 * @private
 * @param {Object} config конфиг для приложения
 * @param {String} config.name имя приложения
 * @param {String} config.base_dir Корневая директория приложения, в ней по умолчанию ищутся директории с моделями,
 * контроллерами, вьюшками,компонентами, а также относительно нее задаются другие пути в конфигурационном файле
 * @param {Object} [config.params={}] Параметры приложения, которые доступны в любом месте приложения через функцияю
 * {@link Application.get_param}
 * @param {String} [config.default_controller="action"] Контроллер использующийся по умолчанию там где не указан явно.
 * При подключении к приложению по любому из протоколов, у этого контроллера вызывается действие
 * {@link Controller.connect_client}, где можно например произвести авторизацию клиента. Имя контроллера должно
 * совпадать с названием файла, в котором он описан.
 * @param {String} [config.views_folder="views"] путь от base_dir до места где будут искаться шаблоны
 * @param {String} [config.models_folder="models"] путь от base_dir до моделей
 * @param {String} [config.controllers_folder="controllers"] путь от base_dir до контроллеров
 * @param {String} [config.components_folder="components"] путь от base_dir до пользовательских компонентов
 * @param {Number} [config.session_live_time=60000] время, которое живет сессия без клиентов в мс
 * @param {Boolean} [config.cache_views=true] Если значение true - вьюшки подгружаются один раз при создании
 * приложения и больше никогда не проверяются на изменения, если false - измененные вьюшки перезагружаются каждый раз
 * при обращении к ним
 * @param {Object} [config.router={}] Настройки компонента отвечающего за перенаправление запросов и генерацию УРЛ,
 * подробнее в {@link Router._init}
 * @param {String[]} [config.preload_components=[]] Компоненты, загружаемые до инициализации ядра приложения.
 * Системные компоненты, которые стоит указывать в этой секции, если они используются (т е указаны в params.components):
 * log_router - чтобы видеть в логе этапы инициализации ядра, db - для инициализации моделей, которые используют доступ
 * к базе данных
 * @param {Object} [config.components={}] Настройка подключаемых компонентов. Здесь указываются как компаненты autodafe,
 * так и пользовательские. Ключами всегда является название подключаемого компонентка ( для пользовательских компонентов
 * это название файла ), а значениями - настройки для компонента. Если для компонента не надо передавать настройки,
 * нужно просто указать true. Список системных компонентов можно посмотреть в
 * {@link ComponentsManager._system_components}
 */
Application.prototype._init = function ( config ) {
  this.setMaxListeners( 1000 );

  Application.parent._init.call( this );

  /**
   * Настройки приложения
   *
   * Передаются при инициализации. Подробное описание в {@link Application._init}. Тем не менее этот объект может
   * незначительно отличаться от того, что был изначально в конфигурации, так как некоторые компоненты и модули меняют
   * параметры переданные им.
   *
   * @private
   * @type {Object}
   */
  this._config        = config            || {};

  if ( typeof this._config.name != 'string' )
      throw new Error( 'Please specify application name in your config file' );

  if ( !this._config.base_dir )
      throw new Error( 'Please specify `base_dir` in your config file!' );

  /**
   * Хранилище сессий
   *
   * Объект в котором храняться сессии, созданные в методе {@link Application.get_session} Ключи объекта -
   * идентификаторы сессий, значения - экземпляры класса {@link Session}
   *
   * @private
   * @type {Object}
   */
  this._sessions      = {};

  /**
   * Последние модификации вьюшек
   *
   * Хэш хранит даты последнего изменения вьюшек. Если cache_views выставлено в false, то во время
   * {@link Controller.send_response} вьюшки, имеющие время последнего обновления отличное от хранящегося здесь, будут
   * перезагружены. Ключи объекта - пути к шаблонам, значения время последней модификации в мс
   *
   * @private
   * @type {Object}
   */
  this._views_mtime   = {};

  /**
   * Запуск сразу после инициализации
   *
   * Признак того, что приложение надо запустить сразу после его инициализации, выставлется в true, если запуск
   * приложения {@link Application.run} был вызван еще до окончания инициализации.
   *
   * @private
   * @type {Boolean}
   */
  this._run_on_init   = false;

  /**
   * Шаблоны загружены
   *
   * выставляется в true после первой загрузки шаблонов
   *
   * @type {Boolean}
   */
  this.views_loaded   = false;

  /**
   * Имя приложения
   *
   * Задается в конфигурационном файле, неизменяемо во время работы приложения.
   *
   * @type {String}
   */
  this._.name         = this._config.name;

  /**
   * Корневая директория приложения
   *
   * Нормализованный путь до корневой директории приложения. Указывается в конфигурационном файле, после чего
   * претерпивает изменения через функцию path.normolize. Неизменяем во время работы приложения.
   *
   * @type {String}
   */
  this._.base_dir     = path.normalize( this._config.base_dir );

  /**
   * Признак того, что приложение запущенно
   *
   * Выставляется в true если был вызов {@link Application.run}. Свойство доступно только для
   * чтения.
   *
   * @type {Boolean}
   */
  this._.is_running   = false;

  /**
   * Логгер приложения
   *
   * Для того чтобы отправить сообщение в логгер, можно использовать функцию обертку {@link Application.log} самого
   * приложения или же {@link AppModule.log} для классов унаследованных от AppModule. Настройка логирования происходит
   * в конфигурационном файле.
   *
   * @type {Logger}
   */
  this.logger         = new Logger;

  /**
   * Роутер приложения
   *
   * Обрабатывает запросы, которые обычно поступают приложению от клиентов (см. {@link Client}), и перенаправляет их
   * (запросы) в нужный метод указанного контроллера (см. {@link Controller}. Настройка производится в конфигурационном
   * файле.
   *
   * @type {Router}
   */
  this.router         = null;

  /**
   * Менеджер компонентов
   *
   * Занимается загрузкой компонентов. Настройка компонентов производится в конфигурационном файле, секция components
   *
   * @type {ComponentsManager}
   */
  this.components     = null;

  this.validator      = new Validator({
    app : this
  });

  this.params        = this._config.params || {};

  /**
   * Менеджер моделей
   *
   * Это Proxy объект для {@link ModelsManager}. Через данное свойство можно получить доступ к моделям приложения, а
   * именно можно создать модель и получить доступ к методам модели без ее явного создания.
   *
   * @type {Proxy}
   * @example примеры использования свойства models
   *
   * Допустим, что в папке {@link Application.path_to_models} у нас лежит файл post.js, который содержит правильно
   * описанную модель ({@link Model}) Post.
   *
   * Модели можно создавать, пользуясь конструктором
   *
   * <pre><code class="javascript">
   * var Post = require('post');
   * var post = new Post({
   *   app : application
   * });
   * </code></pre>
   *
   * но это гораздо удобнее делать пользуясь свойством Application.models
   *
   * <pre><code class="javascript">
   * var post    = new application.models.post;    // создаем новую модель
   * //                                    ↑ совпадает с названием файла, содержащего
   * //                                      необходимую модель
   * post.param1 = 42;
   * post.param2 = 'text';                         // задаем необходимые атрибуты
   * post.save();                                  // и сохраняем
   * </code></pre>
   *
   * Если мы хотим передать в конструктор модели параметы, можно поступить следующим образом:
   *
   * <pre><code class="javascript">
   * var post = new application.models.post({
   *   author : 'Andrew'
   * });
   * </code></pre>
   *
   * Допустим у нашей модели есть некий статичный метод, назовем его find, который находит и создает другие модели по
   * определенным правилам. Для его вызова нам необязательно создавать модель, мы можем использовать следующую
   * особенность свойства models:
   *
   * <pre><code class="javascript">
   * application.models.post.find();       // создаст экземпляр модели Post, и вызовет метод find
   * //                  ↑ совпадает с названием файла
   *
   * application.models.post.find();       // при повторном вызове берет уже созданный и закэшированный
   *                                       // экземпляр класса Post и вызывает у него find
   * </code></pre>
   *
   * Напоследок типы используемых переменных:
   *
   * <pre><code class="javascript">
   * var Post = require('post');
   * application.models.post == Post;                  // false - models.post это не конструктор модели
   * application.models.post instanceof Post;          // false - и не экземпляр
   * application.models.post instanceof Function;      // true  - это прокси функции
   *
   * var post = new application.models.post;
   * post instanceof Post;                             // true
   * </code></pre>
   *
   * @see Model
   * @see ModelsManager
   * @see ModelConstructorProxyHandler
   *
   */
  this.models         = null;

  /**
   * Стандартный контроллер
   *
   * Контроллер, в который перенаправляются действия по умолчанию.
   *
   * @type {String}
   * @see Controller
   * @see Router
   * @see Client._call_controller
   */
  this.default_controller     = this._config.default_controller || 'action';

  /**
   * Местоположение моделей
   *
   * @type {String}
   */
  this._.path_to_models       = path.join( this.base_dir, this._config.models_folder      || 'models'      );

  /**
   * Местоположение контроллеров
   *
   * @type {String}
   */
  this._.path_to_controllers  = path.join( this.base_dir, this._config.controllers_folder || 'controllers' );

  /**
   * Местоположение компонентов
   *
   * @type {String}
   */
  this._.path_to_components   = path.join( this.base_dir, this._config.components_folder  || 'components'  );

  /**
   * Местоположение шаблонов
   *
   * @type {String}
   */
  this._.path_to_views        = path.join( this.base_dir, this._config.views_folder       || 'views'       );

  this._preload_components();
  this._init_core();
  this.on( 'core_is_built', this._load_components );
  this.on( 'components_are_loaded', function() {
    this.run = this.__run;
    this.log( 'Application is ready to run', 'info' );
    this.emit( 'ready' );
  } );
};


/**
 * Инициализирует ядро
 *
 * Метод подгружает вьюшки и модели, инициализирует роутер и контроллеры
 *
 * @private
 */
Application.prototype._init_core = function () {
  if ( this._config.cache_views !== false ) this.load_views();

  this._init_models();
  this.on( 'models_are_loaded', this._init_router );
  this.on( 'router_is_ready', function() {
    this.emit( 'core_is_built' );
  } );
};


/**
 * Загружает шаблоны
 *
 * @param {String} [view_path=''] путь, начиная от {@link Application.path_to_views}, где будут рекурсивно собираться
 * шаблоны
 */
Application.prototype.load_views = function ( view_path ) {
  if ( !view_path && this.views_loaded && this._config.cache_views !== false ) return true;

  var full_view_path = path.join( this.path_to_views, view_path );
  var stats          = null;

  try {
    stats = fs.statSync( full_view_path );
  }
  catch(e) {
    this.log( 'Views folder is not found. Skip loading views', 'warning' );
  }

  if ( stats && stats.isDirectory() ) fs.readdirSync( full_view_path ).forEach( function( file ) {
    this.load_views( path.join( view_path, file ) );
  }, this );

  else if ( stats && stats.isFile() && this._views_mtime[ view_path ] != stats.mtime.getTime() ) {

    this.log( 'Load view `%s`'.format( view_path ), 'trace' );

    var template  = fs.readFileSync( full_view_path, 'utf8' );
    var compiled  = dust.compile( template, view_path );

    this._views_mtime[ view_path ] = stats.mtime.getTime();
    dust.loadSource( compiled );
  }

  if ( !view_path ) {
    this.views_loaded = true;
    if ( stats ) this.log( 'Views are loaded', 'info' );
    this.emit( 'views_are_loaded' );
  }
};


/**
 * Инициализация моделей
 *
 * Создает {@link ModelsManager} и свойство {@link Application.models}
 *
 * @private
 */
Application.prototype._init_models = function(){
  var models_manager = new ModelsManager({
    app : this
  });

  var models_handler = new ProxyHandler({
    target : models_manager
  });
  models_handler.get = function( receiver, name ){
    return models_manager.get_model( name ) || Object.getPrototypeOf( this ).get.call( this, receiver, name );
  }
  this._.models = models_handler.get_proxy();

  var self = this;
  models_manager.load_models( function( e ) {
    if ( e ) self.emit( 'error', e );
    else self.emit( 'models_are_loaded' );
  } );
};


/**
 * Инициализирует роутер
 *
 * @private
 * @see Router
 * @see Application.router
 * @see Application.router_is_ready
 */
Application.prototype._init_router = function () {
  var router_cfg  = this._config.router || {};
  router_cfg.app  = this;
  try {
    this.router     = new Router( router_cfg );
  }
  catch( e ){
    this.emit( 'error', e );
    return false;
  }

  this.log( 'Router is initialized', 'info' );
  this.emit( 'router_is_ready' );
};


/**
 * Загружает компоненты из секции preload_components
 *
 * Загрузка происходит до инициализации ядра {@link Application._init_core}. В этот момент недоступны модели,
 * контроллеры и другие компоненты.
 *
 * @private
 */
Application.prototype._preload_components = function () {
  this.log( 'Preload components' );

  this.components = new ComponentsManager( {
    app        : this
  } );

  var components  = this._config.components         || {};
  var preload     = this._config.preload_components || [];

  preload.forEach( function( name ){
    var params = components[ name ];
    if ( params ) this.components.load( name, params );
  }, this );
};


/**
 * Загружает компоненты оставшиеся после {@link Application._preload_components}
 *
 * @private
 */
Application.prototype._load_components = function () {
  this.log( 'Load components' );
  var components  = this._config.components         || {};

  for( var name in components ){
    var params = components[ name ];
    if ( params ) this.components.load( name, params );
  }

  this.log( 'Components are loaded', 'info' );
  this.emit( 'components_are_loaded' );
};


/**
 * Регистрирует компонент
 *
 * Создает геттер и сеттер для свойства приложения одноименного с именем компонента. Геттер возвращает результат
 * функции {@link Component.get}
 *
 * @param {Component} component регистрируемый компонент
 * @throws {Error} при регистрации экземпляра класса неунаследованного от {@link Component}
 * @throws {Error} если данное имя уже занято компонентом, свойством или методом {@link Application}
 * @example Пример использования
 *
 * <pre><code class="javascript">
 * var my_component = new MyComponent({
 *   app   : application,
 *   name  : 'my_component'
 * });
 *
 * application.register_component( my_component );
 * application.my_component;                        // теперь вернет результат my_component.get();
 * application.my_component = "some value";         // throws Error
 * </code></pre>
 *
 * Неправильно названные компоненты вызовут ошибку во время регистрации:
 *
 * <pre><code class="javascript">
 * var my_component = new MyComponent({
 *   app   : application,
 *   name  : 'default_controller'                   // одноименно со свойством приложения
 * });
 *
 * application.register_component( my_component );  // throws Error
 * </code></pre>
 *
 * Регистрация двух компонентов с одним именем также вызовет ошибку.
 */
Application.prototype.register_component = function ( component ) {
  if ( !autodafe.Component.is_instantiate( component ) )
    throw new Error( 'Try to register `%s` as Component'.format( component && typeof component && component.class_name ) );

  var name = component.name;

  var property_descriptor = Object.getOwnPropertyDescriptor( this, name );
  if ( property_descriptor ) throw new Error(
    autodafe.Component.is_instantiate( property_descriptor.value || this._[name].value )
    ? 'Try to register two components with same name: %s'.format( name )
    : 'Try to register a component with name engaged for property of application: %s'.format( name )
  );

  this._[ name ] = component;
  this._[ name ].get = function( descriptor ) {
    return descriptor.value.get();
  };

  this._[ name ].set = function( v ) {
    throw new Error(
      'Property `%s` in Application engaged by component. \
       You can\'t redefine it to `%s`'.format( name, v )
    );
  }
};


/**
 * Возвращает параметр приложения
 *
 * @param {String} name имя параметра
 * @returns параметр приложения
 * @example Пример использования
 *
 * допустим в конфигурационном файле секция params выглядит так:
 *
 * <pre><code class="javascript">
 * // ...
 *   params : {
 *     param1 : 42,
 *     param2 : {
 *       fun : function() {
 *       }
 *     }
 *   },
 * //...
 * </code></pre>
 *
 * Тогда мы можем взять param1 и param2 следующем образом:
 *
 * <pre><code class="javascript">
 * application.get_param( 'param1' );
 * var param2 = application.get_param( 'param2' );
 * param2.fun();
 * </code></pre>
 */
Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] === undefined ? null : this._config.params[ name ];
};


/**
 * Запускает приложение
 *
 * Приложение запускается асинхронно, поэтому данная функция, если приложение еще не проинициализированно, лишь
 * помечает его, чтобы оно запустилось сразу после инициализации.
 *
 * @param {Function} [callback=AppModule.default_callback] вызывается после
 * полного запуска приложения,
 * @param {Error} callback.error если во время запуска приложения произошла ошибка она будет передана первым параметром
 * @param {Application} callback.app
 * @returns {Boolean} true - если все хорошо, false если приложение уже запущено или будет запущено после инициализации
 * @example Создание и запуск приложения с отслеживанием ошибок
 *
 * <pre><code class="javascript">
 * var application = autodafe.create_application( config, function( e, app ){
 *   if ( e ) throw e;                                    // ошибка во время инициализации
 *   console.log( 'Приложение готово к запуску' );
 * } );
 *
 * application.run( function( e, app ){
 *   if ( e ) throw e;                                    // ошибка во время запуска
 *   console.log( 'Приложение запущено' );
 * } );
 * </code></pre>
 *
 * @see Application.__run
 * @see Application#event:run
 * @see ClientConnection.run
 */
Application.prototype.run = function ( callback ) {
  if ( this._run_on_init ) return false; // double run before init

  this._run_on_init = true;
  this.once( 'ready', function(){
    this.__run( callback );
  } );
  return true;
};


/**
 * Реальный запуск приложения после его инициализации
 *
 * Функция встает на место {@link Application.run} после того как приложение проинициализировано
 * {@link Application.ready}.
 *
 * @private
 * @param {Function} [callback] см. {@link Application.run}
 */
Application.prototype.__run = function ( callback ) {
  if ( this.is_running ) return false;

  callback = callback || autodafe.AppModule.prototype.default_callback;

  this.log( 'Running application' );
  this._.is_running = true;
  this.emit( 'run' );

  process.nextTick( callback.bind( null, null, this ) );
  return true;
};


/**
 * Логирует сообщение
 *
 * Метод иcпользует {@link Logger.log} Данный метод является сокращением для application.logger.log, у всех классов
 * унаследованных от {@link AppModule} есть свой метод для логирования {@link AppModule.log}, который автоматически
 * определяем имя модуля.
 *
 * @param {String|Error} message Сообщение, которое будет залогировано. Может быть строкой содержащей текст сообщения
 * или ошибкой. В случае, когда тип параметра Error, второй параметр автоматически выставится в 'error', но его можно
 * переопределить на любой другой. Если в логгер попадает объект класса Error, то логгер показывает trace пользуясь
 * именно ошибкой ( Error.trace ) , что точнее определяет место ее возникновения
 * @param {String} [level] Тип сообщения, может быть "info", "trace", "warning" или "error". По умолчанию - "trace".
 * Если первый параметр ошибка, по умолчанию - "error"
 * @param {String} [module] Имя модуля, которое будет прописано в логе
 */
Application.prototype.log = function ( message, level, module ) {
  this.logger.log( message, level, module );
};


/**
 * Метод ищет существующую сессию с указанным id и возвращает ее. Если не находит создает новую. Если указан клиент -
 * добавляет клиента к сессии (Session.add_client). Если сессия была закрыта (Session) она удаляется из закешированных
 * сессий {@link Application._sessions}
 *
 * @param {String} id Идентификатор сессии
 * @param {Client} [client] Можно указать клиента, который будет привязан либо к существующей, либо к только что
 * созданной сессии
 *
 * @example Пример использования
 * <pre><code class="javascript">
 * application.get_session( 5 );
 * application.get_session( "C9FDF8DE-C848-4411-B098-7689A04E841B", new Client({
 * //...
 * }) );
 * </code></pre>
 *
 * @see Application.new_session
 */
Application.prototype.get_session = function ( id, client ) {
  var session = this._sessions[ id ];

  if ( !session ) {
    session = new Session({
      id        : id,
      app       : this,
      live_time : this._config.session_live_time
    });

    this._sessions[ id ] = session;

    var self = this;
    session.once( 'close', function() {
      delete self._sessions[ id ];
    } );

    if ( client ) session.add_client( client );
    this.emit( 'new_session', session );
  }
  else if ( client ) session.add_client( client );

  return session;
};


/**
 * Останавливает приложение
 *
 * Обычно на это реагируют сервера созданные в компонентах и они освобождают заданные порты.
 *
 * @see Application#event:stop
 */
Application.prototype.stop = function () {
  this.log( 'Stop application' );
  this.emit( 'stop' );
  this._.is_running = false;
  this.run = Application.prototype.run;
  this.log( 'Application has stopped', 'info' );
};


/**
 * Создает подключение к приложение
 *
 * Подключение можно создавать автоматически, если указать необходимые настройки в конфигурационном файле приложения,
 * например в секциях config.components.http и config.components.web_sockets Данный метод удобно использовать в
 * приложениях, которые создают множество различных подключений. Также при помощи метода можно создать внутреннее
 * подключение, которое довольно удобно использовать в тестах.
 *
 * @param {String} [type="internal"] тип подключения; может быть "http", "ws" и "internal"
 * @param {Object} [params] параметры для создаваемого подключения
 * @returns {ClientConnection} в зависимости от типа подключения может возвращать {@link HTTPServer} и
 * {@link WebSocketsServer}
 */
Application.prototype.create_connection = function( type, params ){
  if ( !params )      params = {};
  if ( !params.name ) params.name = type || 'internal';
  params.app = this;

  switch( type ) {
    case 'http':
      return new global.autodafe.cc.http.Server( params );

    case 'ws':
      return new global.autodafe.cc.ws.Server( params );

    default:
      return new global.autodafe.cc.ClientConnection( params );
  }
}