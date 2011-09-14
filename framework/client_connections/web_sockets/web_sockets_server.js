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

  this._server  = global.autodafe.get_server( this.port, this.app );
  if ( !this._server ) this.log( 'WebSockets server not running at port ' + this.port, 'warning' );

  this._io = io.listen( this._server );

  var self = this;
  this._io.on( 'connection', function( client ) {
    new WebSocketsClient({
      app       : self.app,
      ws_client : client,
      transport : self
    });
  } );
};


WebSocketsServer.prototype.close = function () {
  try{
    if ( this._server ) this._server.close();
  } catch( e ) {
    this.log( e, 'warning' );
  }
};