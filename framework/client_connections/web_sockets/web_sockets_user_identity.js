var UserIdentity = require('users/user_identity');
var cookie       = require('lib/cookie');

module.exports = WebSocketsUserIdentity.inherits( UserIdentity );

function WebSocketsUserIdentity( params ) {
  return this._init( params );
}


WebSocketsUserIdentity.prototype._init = function( params ) {
  if ( !params || !params.client ) throw new Error( '`client` is not defined in WebSocketsUserIdentity._init' );

  this._client      = params.client;
  params.session_id = this._client.sessionId;
  delete params.client;

  return this.super_._init( params );
};


WebSocketsUserIdentity.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this._client.request.headers.cookie, cookie_name );
};


WebSocketsUserIdentity.prototype.broadcast = function ( controller, action, params ) {
  this.enum_similar_identities( function() {
    this.send( controller, action, params );
  } );
};