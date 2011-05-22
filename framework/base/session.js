var AppModule = require('app_module');

module.exports = Session.inherits( AppModule );

function Session( params ) {
  this._init( params );
}


Session.prototype._init = function( params ) {
  this.super_._init( params );

  if ( typeof params.id == 'undefined' )
    throw new Error( 'Try to create session without id' );
  this._.id = params.id;

  var Client = require( 'client_connections/client' );
  if ( !Client.is_instantiate( params.client ) )
    throw new Error( '`client` is not instance of Client in Session._init' );
  this._.client = params.client;

  this._.is_active = true;
};


Session.prototype.close = function () {
  this._.is_active = false;
  this.emit( 'close' );
};