var path = require('path');

module.exports = Controller.inherits( autodafe.AppModule );


/**
 * Базовый класс для всех контроллеров в приожении.
 *
 * Контроллеры реализуют логику выполнения запросов в приложении. У контроллеров есть специальные методы - действия.
 * Они вызываются из роутера, куда попадают все запросы к приложению. Из действий контроллеров можно легко получить
 * доступ к любому из компонентов, а также отрисовать представление и отослать его необходимым клиентам.
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params см. {@link Controller._init}
 * todo: example
 */
function Controller( params ) {
  this._init( params );
}


/**
 * @see <a href="http://akdubya.github.com/dustjs/">dust</a>
 */
Controller.prototype.dust = require('dust.js');


/**
 * Инициализация контроллера
 *
 * @private
 * @param {Object} params параметры для инициализации контроллера, см. также {@link AppModule._init}
 * @param {String} params.name имя контроллера
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
   * Вы можете заменить это свойство в наследуемых контроллерах.
   *
   * @type {String}
   * @default "index"
   */
  this.default_action = 'index';

  /**
   * Ссылка на {@link Application.models} Доступно только для чтения
   *
   * @type {Proxy}
   * @see ModelsManager
   */
  this._.models       = this.app.models;

  this._url_function_for_dust     = this._url_function_for_dust.bind( this );
  this._widget_function_for_dust  = this._widget_function_for_dust.bind( this );
};


/**
 * Выполняется перед действием
 *
 * Метод выполняется непосредственно перед выполнением действия. Предпологается что этот метод будет переопределен в
 * наследуемых классах.
 *
 * @param {String} action название действия, перед которым выполняется метод
 * @param {Object} params параметры, которые предназначены для этого действия
 * @param {Client} client клиент от которого пришел запрос
 * @returns {Boolean|Array|undefined} Если метод вернет false - ни само действие, ни {@link Controller.after_action}
 * вызваны не будут. Если метод вернет массив - то элементы этого массива будут переданы в действие и
 * {@link Controller.after_action} в качестве аргументов. В любом другом случае действие выполниться с аргументами по
 * умолчанию: params, client
 */
Controller.prototype.before_action  = function ( action, params, client ) { return undefined; };


/**
 * Выполняется после действия
 *
 * Метод выполняется сразу после выполнением действия с аргументами которые были переданы действию. С добавленным
 * первым аргументов. Подробнее в {@link Controller.before_action} Для использования - переопределите метод в
 * наследуемом классе.
 *
 * @param {String} action выолненное действие
 */
Controller.prototype.after_action   = function ( action /*, params, client*/ ) {};


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
 * Проверяет, существует ли действие, после чего запускает {@link Controller.before_action}, сам метод и
 * {@link Controller.after_action}
 *
 * @param {String} [action={@link Controller.default_action}] вызываемое действие
 * @param {Object} [params={}] параметры к действию
 * @param {Client} [client] клиент вызвавший действие
 * @throws {Error} если указано неправильное имя действия
 * @returns результат выполненного действия
 */
Controller.prototype.run_action = function ( action, params, client ) {
  action = action || this.default_action;

  if ( typeof this[ action ] != 'function' )
    throw new Error( 'Unspecified action "%s" in Controller "%s"'.format( action, this.name ) );

  params = params || {};
  var before_action_result = this.before_action( action, params, client );
  if ( before_action_result === false ) return false;

  var args = before_action_result instanceof Array
    ? before_action_result
    : [ params, client ];

  var res = this[ action ].apply( this, args );

  args.unshift( action );
  this.after_action.apply( this, args );

  return res;
};


/**
 * Рендерит вью
 *
 * Компанует текст вьюшки используя библиотеку <a href="http://akdubya.github.com/dustjs/">dust</a> Перед генерацией
 * текста пытается обновить вьюшки, см. {@link Application.load_views}
 *
 * @param {String} view путь к вью начиная от директории {@link Application.path_to_views}, либо название файла, если
 * его имя уникально в этой директории
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
 * Отсылает вью клиенту
 *
 * Компанует текст вьюшки используя библиотеку <a href="http://akdubya.github.com/dustjs/">dust</a> и отсылает его
 * через транспорт привязанный к указанному клиенту
 *
 * @param {String} view путь к вью начиная от директории {@link Application.path_to_views}, либо название файла, если
 * его имя уникально в этой директории
 * @param {Client} client клиент, которому надо отослать ответ
 * @param {Object} [params={}] параметры для вью
 * @param {Function} [callback={@link AppModule.default_callback}] функция, которая будет вызвана при окончаниии генерации шаблона
 * @param {Error} callback.error Ошибка, которая может возникнуть при генерации шаблона
 * @param {String} callback.text текст шаблона
 */
Controller.prototype.send_response = function ( view, client, params, callback ) {
  if ( typeof callback != 'function' ) callback = this.default_callback;
  params   = params   || {};

  params.url    = this._url_function_for_dust;
  params.widget = this._widget_function_for_dust;

  this.render( view, params, function( e, data ) {
    if ( e ) callback( e );
    var action = params.ws_client_action || '';
    client.send( data, action );
    callback( null, data );
  } );
};


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
  return this.app.components.create_widget( widget_name, params );
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
  var self = this;
    return chunk.map( function( chunk ){
      var widget = context.get( params.name );
      widget.render( function( data ){
        chunk.end( data );
      } )
    } );
};
