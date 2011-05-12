var AppModule = require('app_module');

module.exports = Client.inherits( AppModule );

function Client( params ) {
  this._init( params );
}


Client.prototype._init = function( params ) {
  this.super_._init( params );

  var ClientConnection = require( './client_connection' );
  if ( !ClientConnection.is_instantiate( params.connector ) )
    throw new Error( '`connector` is not instance of ClientConnection in Client._init' );

  this.connector = params.connector;
};