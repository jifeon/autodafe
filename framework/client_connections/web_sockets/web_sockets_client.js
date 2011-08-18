var Client = require('../client');
var cookie = require('lib/cookie');

module.exports = WebSocketsClient.inherits( Client );

function WebSocketsClient( params ) {
  this._init( params );
}


WebSocketsClient.prototype._init = function( params ) {
  if ( !params || !params.ws_client )
    throw new Error( '`ws_client` should be Socket.IO client in WebSocketsClient.init' );

  this.ws_client = params.ws_client;

  this.super_._init( params );
};


WebSocketsClient.prototype.init_events = function () {
  this.super_.init_events();

  var self = this;
  this.ws_client.on( 'message', function( message ) {
    self._on_request( message );
  } );

  this.ws_client.on( 'disconnect', function() {
    self.disconnect();
  } );
};


WebSocketsClient.prototype.connect = function () {
  this._on_request = this._on_request_after_connect;
  this.super_.connect();
};


WebSocketsClient.prototype._on_request = function ( message ) {
  var self = this;
  this.on( 'connect', function() {
    self._on_request_after_connect( message );
  } );
};


WebSocketsClient.prototype._on_request_after_connect = function ( message ) {
  this.emit( 'request', message );
};


WebSocketsClient.prototype.get_session_id = function () {
  return this.ws_client.sessionid;
};


WebSocketsClient.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this.ws_client.request.headers.cookie, cookie_name );
};


WebSocketsClient.prototype.send = function ( data ) {
  this.super_.send( data );

  this.ws_client.send( data );
};