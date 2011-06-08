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

  this._.transport = params.transport;
};


Client.prototype.get_cookie = function ( cookie_name ) {
  return null;
};


Client.prototype.send = function ( data ) {
  this.transport.send_response( this, data );
};


Client.prototype.broadcast = function () {
  
};