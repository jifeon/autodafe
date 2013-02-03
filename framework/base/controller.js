var path = require('path');

module.exports = Controller.inherits( global.autodafe.AppModule );

/**
 * Базовый класс для всех контроллеров в приожении.
 *
 * Контроллеры реализуют логику выполнения запросов в приложении. У контроллеров есть специальные методы - действия.
 * Они вызываются из роутера, куда попадают все запросы к приложению. Из действий контроллеров можно легко получить
 * доступ к любому из компонентов, а также компоновать представление и отослать его необходимым клиентам.
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params параметры для инициализации
 * @param {String} params.name имя контроллера
 * todo: example
 */
function Controller( params ) {
  this._init( params );
}


/**
 * @see <a href="https://github.com/vybs/dustjs">LinkedIn dust</a>
 * @see <a href="http://akdubya.github.com/dustjs/">dust</a>
 */
Controller.prototype.dust = require('dustjs-linkedin');


/**
 * Инициализация контроллера
 *
 * @private
 * @param params см. конструктор {@link Controller}
 */
Controller.prototype._init = function ( params ) {
  Controller.parent._init.call( this, params );

  if ( !params.name )
    throw new Error( 'Parameter `name` is required for Controller creation' );

  /**
   * Имя контроллера
   *
   * Если контроллер быд загружен стандартным путем имя соответствует названию файла, в которм он лежит. Доступно только
   * для чтения
   *
   * @type {String}
   */
  this._.name         = params.name;

  /**
   * Действие по умолчанию
   *
   * В различных ситуация когда вызывается действие контроллера без явного указания действия, выполняется это действие.
   * Можно заменять это свойство в наследуемых контроллерах.
   *
   * @type {String}
   * @default "index"
   */
  this.default_action = 'index';

  /**
   * Директория, в которой лежат представления для данного контроллера
   *
   * Можно указать не просто имя директории, но и относительный путь, начиная от {@link Application.path_to_views}
   *
   * @type {String}
   * @default "."
   */
  this.views_folder   = '.';

  /**
   * Абсолютный путь до директории, в которой данный контроллер по умолчанию ищет представления
   *
   * Свойство доступно только для чтения
   *
   * @field
   * @name views_path
   * @type {String}
   */
  this._.views_path.get = function(){
    return path.join( this.app.path_to_views, this.views_folder );
  }

  /**
   * Расширение представлений, используемое по умолчанию для данного контроллера
   *
   * @type {String}
   */
  this.views_ext      = '.html';

  /**
   * Ссылка на {@link Application.models}
   *
   * @type {Proxy}
   * @see ModelsManager
   */
  this.models         = this.app.models;

  /**
   * Глобальные обработчики действий эмиттеров из экземпляров {@link Response}
   *
   * @type {Object}
   */
  this.behaviors      = {};

  /**
   * Специальные функции для dust
   *
   * @type {Object}
   */
  this.views_functions = {
    'url'     : this._url_function_for_dust.bind( this ),
    'widget'  : this._widget_function_for_dust.bind( this ),
    't'       : this._t_function_for_dust.bind( this ),
    'if'      : this._dust_if.bind( this ),
    'if_not'  : this._dust_if_not.bind( this )
  };
};


/**
 * Выполняется перед действием
 *
 * Метод выполняется непосредственно перед выполнением действия. Предполагается, что этот метод будет переопределен в
 * наследуемых классах.
 *
 * @param {String} action название действия, перед которым выполняется метод
 * @param {Response} response заготовка ответа на запрос вызвавший действие
 * @param {Request} request запрос, вызвавший действие
 * @returns {Boolean|Array|undefined} Если метод вернет false, действие вызвано не будет. Если метод вернет массив, то
 * элементы этого массива будут переданы в действие в качестве аргументов. В любом другом случае действие выполнится с
 * аргументами по умолчанию: response, request
 */
Controller.prototype.before_action  = function ( action, response, request ) { return undefined; };


/**
 * Подключение клиента
 *
 * Если переопределить данный метод в стандартном контроллере (см. {@link Application.default_controller}), то при
 * подключении каждого клиента, он будет попадать в этот метод. Здесь можно реализовать, например, авторизацию клиентов
 *
 * @param {Client} client только что подключенный клиент
 * @returns {EventEmitter|undefined} если метод возвращает EventEmitter, то никакие действия пришедшие с данного
 * клиента не будут выполнены до тех пор, пока эмиттер не вызовет действие success. При действии error, клиенту будет
 * отправлена ошибка (см. {@link Client.send_error})
 *
 * @see Client._call_controller
 * todo: пример авторизации
 */
Controller.prototype.connect_client = function ( client ) { return undefined; };


/**
 * Запускает действие
 *
 * Проверяет, существует ли действие, после чего запускает {@link Controller.before_action} и сам метод
 *
 * @param {String} [action={@link Controller.default_action}] вызываемое действие
 * @param {Request} [request] запрос, вызвавший действие
 * @throws {Error} если указанное имя действия не соответствует названию метода контроллера
 * @returns {*|Boolean} результат выполненного действия
 */
Controller.prototype.run_action = function ( action, request ) {
  action = action || this.default_action;

  if ( typeof this[ action ] != 'function' )
    throw new Error( 'Unspecified action "%s" in Controller "%s"'.format( action, this.name ) );

  var response = this.create_response( action, request );

  var before_action_result = this.before_action( action, response, request );
  if ( before_action_result === false ) return false;

  var args = before_action_result instanceof Array
    ? before_action_result
    : [ response, request ];

  return this[ action ].apply(this, args);
};


/**
 * Вызывает действие, при этом меняет все пути в {@link Response}
 *
 * Метод удобно использовать для перенаправления действия. Все аргументы, кроме первого попадут в вызываемое
 * действие в том же порядке, что они попали в этот метод
 *
 * @param {String} action имя действия, которое необходимо вызвать
 * @param {Response} response
 * @return {*} Возвращает то, что вернуло вызванное действие
 * @example
 *
 * <pre><code class="javascript">
 * Site.prototype.one = function( response ){
 *   this.action( 'two', response );
 * }
 *
 * Site.prototype.two = function( response ){
 *   response.view_name();  // вернет 'two' как если бы действие было вызвано изначально
 * }
 * </code></pre>
 */
Controller.prototype.action = function( action, response ){
  response.controller = this;
  response.merge_params({cd : this.views_folder});
  response.view_path( path.join( this.views_folder, action + this.views_ext ));
  return this[ action ].apply( this, Array.prototype.slice.call( arguments, 1 ));
}


/**
 * Компанует представление
 *
 * Компанует текст представления используя библиотеку <a href="http://akdubya.github.com/dustjs/">dust</a> Перед
 * генерацией текста пытается обновить кэш представлений, см. {@link Application.load_views}
 *
 * @param {String} view путь к вью начиная от директории {@link Application.path_to_views}
 * @param {Object} [params={}] параметры для вью
 * @param {Function} [callback] функция, которая будет вызвана при окончаниии генерации шаблона
 * @param {Error} callback.error Ошибка, которая может возникнуть при генерации шаблона
 * @param {String} callback.text текст шаблона
 */
Controller.prototype.render = function ( view, params, callback ) {
  this.app.load_views();
  return this.dust.render( view, params || {}, callback );
};


/**
 * Глобальные параметры для всех шаблонов, отправляемых этим контроллером
 *
 * @param {Response} response
 * @param {Request} request
 * @return {Object}
 */
Controller.prototype.global_view_params = function( response, request ){
  return {};
};


/**
 * Создает {@link Response}
 *
 * @param {String} action действие для которого создается response
 * @param {Request} request запрос, который вызвал действие
 * @return {Response}
 */
Controller.prototype.create_response = function( action, request ){
  return new global.autodafe.cc.Response({
    controller  : this,
    app         : this.app,
    view        : action,
    request     : request
  });
}


/**
 * Создает URL
 *
 * При создании пользуется таблицей маршрутизации
 *
 * @param {String} path_to_action путь до действия контроллера
 * @param {Object} [params={}] параметры для создания URL
 * @returns {String} URL
 * @see Router.create_url
 */
Controller.prototype.create_url = function ( path_to_action, params ) {
  return this.app.router.create_url( path_to_action, params, this.name, this.default_action );
};


/**
 * Создает widget
 *
 * @param {String} widget_name имя виджета
 * @param {Object} [params] параметры для виджета
 * @returns {Widget}
 */
Controller.prototype.create_widget = function( widget_name, params ){
  if ( params && !params.controller ) params.controller = this.name;
  return this.app.components.create_widget( widget_name, params );
}


/**
 * Глобальная обработка ошибок из экземпляров {@link Response}
 *
 * @param {Error} e
 * @param {Response} response
 * @param {Request} request
 */
Controller.prototype.handle_error = function( e, response, request ){
  response.send( e );
}


/**
 * Добавляет глобальнй обработчик для действий эмиттеров, используемых в экземплярах {@link Response}
 *
 * @param {String} action действие
 * @param {Function} cb обработчик
 * @return {Controller} this
 */
Controller.prototype.behavior_for = function( action, cb ){
  this.behaviors[ action ] = cb;
  this.emit( 'new_behavior', action, cb );
  return this;
}


/**
 * Функция для создания URL, используемая в шаблонах для <a href="http://akdubya.github.com/dustjs/">dust</a>
 *
 * При инициализации метод заменяется на замыкание, которое вызывает метод в контексте контроллера. Так сделано,
 * чтобы не делать этого каждый раз при {@link Controller.render}
 *
 * @private
 * @param chunk
 * @param context
 * @param bodies
 * @param params
 */
Controller.prototype._url_function_for_dust = function ( chunk, context, bodies, params ) {
  var self = this;

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' )
      params[ param ] = this.app.tools.get_dust_chunk_body_content( chunk, context, value );
  }

  return bodies.block

    ? chunk.tap( function( data ) {
      return self.create_url( data, params );
    }).render( bodies.block, context ).untap()

    : chunk.write( this.create_url( '', params ) );
};


/**
 *
 *
 * При инициализации метод заменяется на замыкание, которое вызывает метод в контексте контроллера. Так сделано,
 * чтобы не делать этого каждый раз при {@link Controller.render}
 *
 * @private
 * @param chunk
 * @param context
 * @param bodies
 * @param params
 */
Controller.prototype._t_function_for_dust = function ( chunk, context, bodies, params ) {
  var self = this;

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' )
      params[ param ] = this.app.tools.get_dust_chunk_body_content( chunk, context, value );
  }

  var response = context.stack.head.response;
  return bodies.block

    ? chunk.tap( function( data ) {
      return self.t( data, response );
    }).render( bodies.block, context ).untap()

    : chunk.write( this.create_url( '', params ) );
};


/**
 * Функция для использования виджета в шаблонах для <a href="http://akdubya.github.com/dustjs/">dust</a>
 *
 * При инициализации метод заменяется на замыкание, которое вызывает метод в контексте контроллера. Так сделано,
 * чтобы не делать этого каждый раз при {@link Controller.render}
 *
 * @private
 * @param chunk
 * @param context
 * @param bodies
 * @param params
 */
Controller.prototype._widget_function_for_dust = function( chunk, context, bodies, params ){
  var no_widget_name_error = 'Please specify widget name. For example: write in template {#widget}widget_name{/widget}';

  if ( !bodies.block ) {
    this.log( no_widget_name_error, 'warning' );
    return chunk;
  }

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' )
      params[ param ] = this.app.tools.get_dust_chunk_body_content( chunk, context, value );
  }

  var widget_name = this.app.tools.get_dust_chunk_body_content( chunk, context, bodies.block );
  if ( !widget_name ) {
    this.log( no_widget_name_error, 'warning' );
    return chunk;
  }

  var widget = context.get( widget_name );
  if ( !widget ) {
    this.log( 'Widget `%s` is not found'.format( widget_name ), 'warning' );
    return chunk;
  }

  var self = this;
  return chunk.map( function( chunk ){
    widget.render( function( e, data ){
      if ( e ) {
        self.log( e, 'warning' );
        return chunk;
      }

      chunk.end( data );
    }, params )
  } );
};


/**
 * "If" function for dust
 *
 * @deprecated
 * @param chunk
 * @param context
 * @param bodies
 * @param params
 * @return {*}
 * @private
 */
Controller.prototype._dust_if = function ( chunk, context, bodies, params ) {
  var condition = true;

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' ) value = this.app.tools.get_dust_chunk_body_content( chunk, context, value );
    if ( context.get( param ) != value ) {
      condition = false;
      break;
    }
  }

  if ( condition ) return chunk.render( bodies.block, context );
  else if ( bodies[ 'else' ] ) return chunk.render( bodies[ 'else' ], context );
  else return chunk;
};


/**
 * "If not" function for dust
 *
 * @deprecated
 * @param chunk
 * @param context
 * @param bodies
 * @param params
 * @return {*}
 * @private
 */
Controller.prototype._dust_if_not = function ( chunk, context, bodies, params ) {
  var condition = true;

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' ) value = this.app.tools.get_dust_chunk_body_content( chunk, context, value );
    if ( context.get( param ) != value ) {
      condition = false;
      break;
    }
  }

  if ( !condition ) return chunk.render( bodies.block, context );
  else if ( bodies[ 'else' ] ) return chunk.render( bodies[ 'else' ], context );
  else return chunk;
};