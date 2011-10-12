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
  this.ws_client.cookie = '';

  var self = this;
  this.ws_client.on( 'message', function( message ) {
    try{
      message = JSON.parse( message );
    } catch( e ) {}
    if( message.action == 'auth' ){
      self.ws_client.cookie += cookie.make( 'autodafe_sid', message.sid );
      self.ws_client.cookie += cookie.make( 'autodafe_email', message.email );
      self.ws_client.cookie += cookie.make( 'autodafe_pass', message.pass );
      self.super_._init( params );
    } else
        self.receive( message );
  } );

  this.ws_client.on( 'disconnect', function() {
    self.disconnect();
  } );

//  this.super_._init( params );
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

  this.super_.receive( data.action, data.params, 'ws' );
};


WebSocketsClient.prototype.get_session_id = function () {
  var sid = this.get_cookie( 'autodafe_sid' );

  return sid ? sid : this.ws_client.id;
};


WebSocketsClient.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this.ws_client.cookie, cookie_name );
};


WebSocketsClient.prototype.send = function ( data ) {
  this.super_.send( data );

  this.ws_client.send( data );
};