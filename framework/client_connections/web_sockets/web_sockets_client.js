var Client = require('../client');
var cookie = require('lib/cookie');

module.exports = WebSocketsClient.inherits( Client );

function WebSocketsClient( params ) {
  this._init( params );
}


WebSocketsClient.prototype._init = function( params ) {
  this.super_._init( params );

  this.ws_client = params.ws_client;

  var self = this;
  this.ws_client.on( 'message', function( message ) {
    self.emit( 'request', message );  
  } );

  this.ws_client.on( 'disconnect', function() {
    self.emit( 'disconnect' );
  } );
};


WebSocketsClient.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this.ws_client.request.headers.cookie, cookie_name );
};


//WebSocketsUserIdentity.prototype.broadcast = function ( controller, action, params ) {
//  this.enum_similar_identities( function() {
//    this.send( controller, action, params );
//  } );
//};