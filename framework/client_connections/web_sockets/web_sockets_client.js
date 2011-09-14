var Client = require('../client');
var cookie = require('lib/cookie');

module.exports = WebSocketsClient.inherits( Client );

function WebSocketsClient( params ) {
  this._init( params );
}


WebSocketsClient.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.ws_client )
    throw new Error( '`ws_client` should be Socket.IO client in WebSocketsClient.init' );

  this.ws_client = params.ws_client;

  var self = this;
  this.ws_client.on( 'message', function( message ) {
    self.receive( message );
  } );

  this.ws_client.on( 'disconnect', function() {
    self.disconnect();
  } );
};


WebSocketsClient.prototype._after_connect = function () {
  this.receive = this.__receive;
  this.super_._after_connect();
};


WebSocketsClient.prototype.receive = function ( message ) {
  var self = this;
  this.once( 'connect', function() {
    self.__receive( message );
  } );
};


WebSocketsClient.prototype.__receive = function ( message ) {
  try {
    var data = JSON.parse( message );
  }
  catch ( e ) {
    return this.log( 'Message "%s" is not a JSON'.format( message ), 'warning' );
  }

  this.super_.receive( data.action, data.params );
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