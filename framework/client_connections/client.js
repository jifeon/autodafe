var Request          = global.autodafe.cc.Request;
var ClientConnection = global.autodafe.cc.ClientConnection;

module.exports = Client.inherits( global.autodafe.AppModule );


/**
 * Базовый класс для клиентов подключенных к приложению
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params см. {@link Client._init}
 * @see HTTPClient
 * @see WebSocketsClient
 */
function Client( params ) {
  this._init( params );
}


/**
 * @event
 * @name Client#connect
 * @description Клиент подключен
 */


/**
 * @event
 * @name Client#disconnect
 * @description Клиент отключен
 */


/**
 * @event
 * @name Client#receive_request
 * @param {Request} request Полученный запрос
 * @description Получен запрос
 */


/**
 * @event
 * @name Client#send
 * @param data
 * @description Отправлена информация клиенту
 */


/**
 * @event
 * @name Client#send_error
 * @param {Error|String}
 * @description Клиенту отправлена ошибка
 */


/**
 * Конструктор для создания запросов от данного клиента
 *
 * @type {Function}
 * @see Request
 * @see HTTPRequest
 * @see WSRequest
 */
Client.prototype.request_contructor = global.autodafe.cc.Request;


/**
 * Инициализация клиента
 *
 * @private
 * @param {Object} params параметры для инициализации клиента
 * @param {ClientConnection} params.connection соединение по которому подключен клиент
 */
Client.prototype._init = function( params ) {
  Client.parent._init.call( this, params );

  if ( !ClientConnection.is_instantiate( params.connection ) )
    throw new Error( '`connection` is not instance of ClientConnection in Client._init' );

  /**
   * Cоединение по которому подключен клиент
   *
   * @type {ClientConnection}
   */
  this._.connection  = params.connection;

  /**
   * Сессия к которой привязан данный клиент
   *
   * @type {Session}
   */
  this._.session     = this.app.get_session( this.get_session_id(), this );

  /**
   * Отображает подключен ли клиент
   *
   * @type {Boolean}
   */
  this._.connected   = false;

  this._call_controller();
};


/**
 * Сообщает стандартному контроллеру о подключении нового клиента
 *
 * Метод выполняется во время создания клиента. Если стандартного контроллера ({@link Application.default_controller})
 * не существует сразу же выполняется {@link Client._after_connect}, иначе у контроллера сначало выполняется
 * {@link Controller.connect_client}. Если {@link Controller.connect_client} вернет EventEmitter, то
 * {@link Client._after_connect} буден выполнен только после того как EventEmitter вызовет действие "success", при
 * "error" будет выполнен {@link Client.send_error}
 *
 * @private
 */
Client.prototype._call_controller = function () {
  var controller = this.app.router.get_controller( this.app.default_controller );
  var emitter;
  if (
    !controller ||
    !( ( emitter = controller.connect_client( this ) ) instanceof process.EventEmitter )
  )
    return this._after_connect();


  var self = this;
  emitter
    .on( 'success', function() {
      self._after_connect();
    } )
    .on( 'error', function( e ){
      self.send_error( e );
    } );
};


/**
 * Метод выполняется после оповещения стандартного контроллера о создании нового клиента
 *
 * В этот момент можно быть уверенным, что данный клиент зарегистрирован в системе.
 *
 * @private
 * @example Перегрузка метода
 *
 * Метод можно переопределять в наследуемых классах с вызовом родительского метода
 * <pre><code class="javascript">
 * MyClient.prototype._after_connect = function(){
 *   MyClient.parent._after_connect.call( this );
 *
 *   // ваши действия с подключенным клиентом
 * }
 * </code></pre>
 */
Client.prototype._after_connect = function () {
  this.log( '%s is connected ( session id=%s )'.format( this.class_name, this.get_session_id() ) );

  this._.connected = true;
  this.emit( 'connect' );
  this.connection.emit( 'connect_client', this );
};


/**
 * Создает запрос
 *
 * @param {Object} [params={}] параметры для запроса, которые будут расширены ссылкой на приложение и клиент. Описание
 * параметров см. в {@link Request}
 * @returns {Request}
 */
Client.prototype.create_request = function ( params ) {
  params        = params || {};
  params.app    = this.app;
  params.client = this;

  return new this.request_contructor( params );
};


/**
 * Вызывается во время отсоединения клиента
 */
Client.prototype.disconnect = function () {
  this.log( '%s is disconnected ( session id=%s )'.format( this.class_name, this.get_session_id() ) );

  this._.connected = false;
  this.emit( 'disconnect' );
  this.connection.emit( 'disconnect_client', this );
};


/**
 * Выполняется при получении запроса клиентом
 *
 * Пытается передать запрос в {@link Router}, при ошибке вызывает {@link Client.send_error}
 *
 * @param {Request} request
 * @see Client.create_query
 */
Client.prototype.receive = function ( request ) {
  this.log( 'Message has been received from %s. Session id - `%s`'.format( this.class_name, this.get_session_id() ) );

  this.emit( 'receive_request', request );
  this.connection.emit( 'receive_request', request, this );

  try {
    this.app.router.route( request );
  }
  catch ( e ) {
    this.send_error( e );
  }
};


/**
 * Отправка сообщения клиенту
 *
 * Метод нужно переопределять в наследуемых классах, с вызовом родительского метода
 *
 * @param data передаваемая информация
 */
Client.prototype.send = function ( data ) {
  this.log( 'Send message to %s ( session id=%s )'.format( this.class_name, this.get_session_id() ) );

  this.emit( 'send', data );
  this.connection.emit( 'send_response', data, this );
};


/**
 * Отправка ошибки клиенту
 *
 * @param {Error|String} e ошибка
 */
Client.prototype.send_error = function ( e ) {
  this.log( e && e.stack || e, 'warning' );

  this.emit( 'send_error', e );
  this.connection.emit( 'send_error', e, this );
};


/**
 * Возвращает id сессии, к которой принадлежит клиент
 *
 * @returns {String}
 */
Client.prototype.get_session_id = function () {
  return this.session ? this.session.id : String.unique();
};


/**
 * Возвращает cookie
 *
 * Нужно переопределить для наследуемых клиентов, если они работают с cookie
 */
Client.prototype.get_cookie = function () {};


/**
 * Задает cookie
 *
 * Нужно переопределить для наследуемых клиентов, если они работают с cookie
 */
Client.prototype.set_cookie = function () {};