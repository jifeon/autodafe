
var UserIdentity = require('user_identity');
var cookie       = require('../lib/cookie');

var WebSocketsUserIdentity = module.exports = function( params ) {
  return this._init( params );
};


require('sys').inherits( WebSocketsUserIdentity, UserIdentity );


WebSocketsUserIdentity.prototype._init = function( params ) {
  this._client = params.client;
  if ( !this._client ) console.log( 'client is undefined in WebSocketsUserIdentity' );

  delete params.client;
  params.session_id = this._client.sessionId;

  return UserIdentity.prototype._init.call( this, params );
};


WebSocketsUserIdentity.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this._client.request.headers.cookie, cookie_name );
};


WebSocketsUserIdentity.prototype.send = function ( controller, action, params ) {
  this._client.send( JSON.stringify( {
    controller  : controller,
    action      : action,
    params      : params
  } ) );
};


WebSocketsUserIdentity.prototype.broadcast = function ( controller, action, params ) {
  this.enum_similar_identities( function() {
    this.send( controller, action, params );
  } );
};