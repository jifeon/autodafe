var http = require( 'http' );

module.exports = ClientConnection.inherits( autodafe.Component );

/**
 * Базовый класс для компонентов выполняющих подключение к приложению
 *
 * @constructor
 * @extends Component
 * @param {Object} params см. {@link ClientConnection._init}
 * @see HTTPServer
 * @see WebSocketsServer
 */
function ClientConnection( params ) {
  this._init( params );
}


/**
 * @event
 * @name ClientConnection#connect_client
 * @param {Client} client подключенный клиент
 * @description Подключен новый клиент
 */


/**
 * @event
 * @name ClientConnection#disconnect_client
 * @param {Client} client отключенный клиент
 * @description Клиент отключен
 */


/**
 * @event
 * @name ClientConnection#receive_request
 * @param {Query} query запрос
 * @param {Client} client клиент от которого получен запрос
 * @description Получен запрос
 */


/**
 * @event
 * @name ClientConnection#send_response
 * @param data Отправленная информация
 * @param {Client} client клиент которому отправлена информация
 * @description Отправлена информация клиенту
 */


/**
 * @event
 * @name ClientConnection#send_error
 * @param {Error|String} ошибка
 * @param {Client} client клиент которому отправлена ошибка
 * @description Клиенту отправлена ошибка
 */


/**
 * Инициализация подключения
 *
 * @private
 * @param {Object} params параметров для инициализации подключения нет, см. {@link Component._init}
 */
ClientConnection.prototype._init = function ( params ) {
  ClientConnection.parent._init.call( this, params );

  this.app.on( 'run',  this._run.bind( this ) );
  this.app.on( 'stop', this.close.bind( this ) );
};


/**
 * Создавет HTTP сервер и начинает слушать его на указанном порту
 *
 * @param {Number} port порт
 * @returns {http.Server|null} Сервер, если все хорошо, и null, если порт занят
 */
ClientConnection.prototype.get_server = function ( port ) {
  var server = http.createServer();

  try {
    server.listen( port );
  }
  catch( e ) {
    this.log( 'Can not listen server on port %s'.format( port ), 'error' );
    return null;
  }

  return server;
};


/**
 * Выполняется при запуске приложения
 *
 * Метод можно переопределить в наследуемых классах, и проводить в нем инициализацию, которая пройдет в полностью
 * рабочем приложении
 */
ClientConnection.prototype._run    = function () {};


/**
 * Выполняется при закрытии приложения
 *
 * Метод можно переопределить в наследуемых классах
 */
ClientConnection.prototype.close  = function () {};