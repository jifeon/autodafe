module.exports = ListenerForResponse.inherits( global.autodafe.lib.Listener );


/**
 * {@link Listener} использующий специальную обработку ошибок и поведений, отправляя их в {@link Response}
 *
 * Для создания используйте {@link Response.new_async_tool}
 *
 * @param {Object} params Параметры для нициализации
 * @param {Response} params.response ответ, создавший Listener
 * @constructor
 */
function ListenerForResponse( params ) {
  this._init( params );
}


/**
 * Инициализация
 *
 * @param params см. конструктор {@link ListenerForResponse}
 * @private
 */
ListenerForResponse.prototype._init = function( params ) {
  ListenerForResponse.parent._init.call( this, params );

  /**
   * Ответ, которым был создан Listener
   *
   * @type {Response}
   */
  this.response = params.response;

  var self = this;
  this.response.controller.on( 'new_behavior', function( action, cb ){
    self.behavior_for( action, cb.bind( null, self.response, self.response.request ));
  } );
};


/**
 * Обработка ошибок
 *
 * По умолчанию все ошибки отправляются на обработку к {@link Response}
 *
 * @param {Error} e
 */
ListenerForResponse.prototype.handle_error = function( e ){
  this.response.handle_error(e);
}