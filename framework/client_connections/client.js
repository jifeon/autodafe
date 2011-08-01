var AppModule = require('app_module');

module.exports = Client.inherits( AppModule );

function Client( params ) {
  this._init( params );
}


Client.prototype._init = function( params ) {
  this.super_._init( params );

  var ClientConnection = require( './client_connection' );
  if ( !ClientConnection.is_instantiate( params.transport ) )
    throw new Error( '`transport` is not instance of ClientConnection in Client._init' );

  this._.transport  = params.transport;
  this._.session    = this.app.get_session( this.get_session_id(), this );

  this.init_events();
};


Client.prototype.init_events  = function () {};
Client.prototype.connect      = function () {
  this.emit( 'connect' );
};


Client.prototype.get_session_id = function () {
  return this.session ? this.session.id : String.unique();
};


Client.prototype.get_cookie = function ( cookie_name ) {
  return null;
};


Client.prototype.send = function ( data ) {
  this.log( 'Send message to %s ( session id=%s )'.format( this.class_name, this.session.id ) );

  this.emit( 'send', data );
};


Client.prototype.send_error = function ( e ) {
  return false;
};


Client.prototype.disconnect = function () {
  this.log( 'Disconnect %s ( session id=%s )'.format( this.class_name, this.session.id ) );

  this.emit( 'disconnect' );
};