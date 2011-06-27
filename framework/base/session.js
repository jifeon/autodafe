var AppModule = require('app_module');

module.exports = Session.inherits( AppModule );

function Session( params ) {
  this._init( params );
}


Session.prototype._init = function( params ) {
  this.super_._init( params );

  if ( typeof params.id == 'undefined' )
    throw new Error( 'Try to create session without id' );

  this._.id         = params.id;
  this._.clients    = [];
  this._.is_active  = true;
};


Session.prototype.add_client = function ( client ) {
  if ( ~this.clients.indexOf( client ) ) {
    this.log( 'Try to add duplicate client', 'warning' );
    return false;
  }

  var Client = require( 'client_connections/client' );
  if ( !Client.is_instantiate( client ) )
    throw new Error( '`client` is not instance of Client in Session.add_client' );

  this.clients.push( client );

  var self = this;
  client.once( 'disconnect', function(){
    self.remove_client( client );
  } );

  return true;
};


Session.prototype.remove_client = function ( client ) {
  var cid = this.clients.indexOf( client );
  if ( cid == -1 ) return;

  this.clients.splice( cid, 1 );
  
  if ( this.clients.length ) this.close();
};


Session.prototype.close = function () {
  this._.is_active = false;
  this.emit( 'close' );
};