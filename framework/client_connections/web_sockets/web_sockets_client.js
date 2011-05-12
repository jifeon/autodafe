var Client = require('../client');

module.exports = WebSocketsClient.inherits( Client );

function WebSocketsClient( params ) {
  this._init( params );
}


WebSocketsClient.prototype._init = function( params ) {
  this.super_._init( params );

  this.ws_client = params.client;

  var self = this;
  this.ws_client.on( 'message', function( message ) {
    self.emit( 'request', message );  
  } );

  this.ws_client.on( 'disconnect', function() {
    self.emit( 'disconnect' );
  } );
};