var AppModule = require('app_module');

module.exports = Session.inherits( AppModule );

function Session( params ) {
  this._init( params );
}


Session.cache = {};

Session.get_by_id = function( id ) {
  return this.cache[ id ] || null;
};


Session.prototype._init = function( params ) {
  this.super_._init( params );

  if ( typeof params.id == 'undefined' )
    throw new Error( 'Try to create session without id' );

  var Client = require( 'client_connections/client' );
  if ( !Client.is_instantiate( params.client ) )
    throw new Error( '`client` is not instance of Client in Session._init' );

  this.client               = params.client;
  this.id                   = params.id;
  Session.cache[ this.id ]  = this;
};


Session.prototype.close = function () {
  delete Session.cache[ this.id ];
};