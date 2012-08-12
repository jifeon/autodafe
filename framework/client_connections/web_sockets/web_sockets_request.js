module.exports = WSRequest.inherits( global.autodafe.cc.Request );


/**
 * Класс описывающий запрос от WebSockets клиента
 *
 * Для создания экземпляра удобнее пользоваться методом {@link WebSocketsClient.create_request}
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params параметры для инициализации
 */
function WSRequest( params ) {
  this._init( params );
}


/**
 * Инициализация запроса
 *
 * @private
 */
WSRequest.prototype._init = function( params ) {
  WSRequest.parent._init.call( this, params );

  this.type = 'ws';
};