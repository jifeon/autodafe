var io                = require('socket.io');
var http              = require('http');
var ClientConnection  = require('../client_connection');
var WebSocketsClient  = require('./web_sockets_client');

module.exports = WebSocketsServer.inherits( ClientConnection );

function WebSocketsServer( config ) {
  this._init( config );
}


WebSocketsServer.prototype._init = function ( params ) {
  this.super_._init( params );

  this._io      = null;
  this._server  = null;

  this._.port   = params.port || 8080;
};


WebSocketsServer.prototype.run = function () {
  this._server  = global.autodafe.get_server( this.port );
  this._io      = io.listen( this._server );

  var self = this;
  this._io.on( 'connection', function( client ) {
    self.connect_client( new WebSocketsClient({
      app       : self.app,
      ws_client : client,
      transport : self
    }) );
  } );
};


WebSocketsServer.prototype.receive_request = function ( message, client ) {
  try {
    var data = JSON.parse( message );
  }
  catch ( e ) {
    return this.log( 'Message "%s" is not a JSON'.format( message ), 'warning' );
  }

  this.super_.receive_request( data, client );
};