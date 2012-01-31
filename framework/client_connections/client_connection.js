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
 * Инициализация подключения
 *
 * @private
 * @param {Object} params параметров для инициализации подключения нет, см. {@link Component._init}
 */
ClientConnection.prototype._init = function ( params ) {
  ClientConnection.parent._init.call( this, params );

  this.app.on( 'run',   this.run.bind( this ) );
  this.app.on( 'close', this.close.bind( this ) );
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
 * Метож можно перегрузить в наследуемых классах, и проводить в нем инициализацию, которая пройдет в полностью
 * рабочем приложении
 */
ClientConnection.prototype.run    = function () {};


/**
 * Выполняется при закрытии приложения
 *
 * Метож можно перегрузить в наследуемых классах
 */
ClientConnection.prototype.close  = function () {};