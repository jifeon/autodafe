var io                = require('socket.io');
var http              = require('http');
var ClientConnection  = require('../client_connection');
var WebSocketsClient  = require('./web_sockets_client');

module.exports = WebSocketsServer.inherits( ClientConnection );

function WebSocketsServer( config ) {
  this._init( config );
}


WebSocketsServer.prototype._init = function ( params ) {
  WebSocketsServer.parent._init.call( this, params );

  this._io      = null;
  this._server  = null;

  this._.port   = params.port || 8080;
};


WebSocketsServer.prototype.run = function () {

  this._server  = this.get_server( this.port );
  if ( !this._server ) return this.log( 'WebSockets server not running at port ' + this.port, 'warning' );

  this._io = io.listen( this._server );
  this._io.set('log level', 2);

  var self = this;
  this._io.sockets.on( 'connection', function( client ) {
    new WebSocketsClient({
      app        : self.app,
      ws_client  : client,
      connection : self
    });
  } );

  this.log( 'WebSockets server started at port ' + this.port, 'info' );
};


WebSocketsServer.prototype.close = function () {
  try{
    if ( this._server ) this._server.close();
  } catch( e ) {
    this.log( e, 'warning' );
  }
};