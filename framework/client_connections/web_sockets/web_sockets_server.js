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
  this._server = http.createServer();
  this._server.listen( this.port );
  
  this._io = io.listen( this._server );

  var self = this;
  this._io.on( 'connection', function( client ) {
    self.connect_client( new WebSocketsClient({
      app       : self.app,
      ws_client : client,
      transport : self
    }), client.sessionId );
  } );
};


WebSocketsServer.prototype.close = function () {
  if ( this._server ) this._server.close();
};


WebSocketsServer.prototype.receive_request = function ( message, session ) {
  try {
    var data = JSON.parse( message );
  }
  catch ( e ) {
    return this.log( 'Message: "%s" is not a JSON'.format( message ), 'warning' );
  }

  this.log( 'WebSockets message has been received. session_id = "%s"'.format( session.id ) );
  this.app.router.route( data.action, data.params, session.client, session );
};


WebSocketsServer.prototype.send_response = function ( client, data ) {
  this.log( 'Send message to websockets client ( id=%s )'.format( client.ws_client.sessionId ) );

  client.ws_client.send( data );
};