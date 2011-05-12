var io                = require('./Socket.IO');
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

  var self = this;
  this.app.on( 'run', function() {
    self.run();
  } );
};


WebSocketsServer.prototype.run = function () {
  this._server = http.createServer();
  this._server.listen( 8080 );
  
  this._io = io.listen( this._server );

  var self = this;
  this._io.on( 'connection', function( client ) {
    self.connect_client( new WebSocketsClient({
      client    : client,
      connector : self
    }), client.sessionId );
  } );
};


WebSocketsServer.prototype.receive_request = function ( message, session ) {
  var data = JSON.parse( message );

  if ( !data ) {
    return this.log( 'Message: "%s" is not a JSON'.format( message ), 'warning' );
  }

  this.log( 'WebSockets message has been received. session_id = "%s"'.format( session.id ) );
  this.app.router.route( data.action, session, data.params );
};


WebSocketsServer.prototype.disconnect_client = function ( client ) {

};