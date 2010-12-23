var ActiveRecord  = require('ar/active_record');
var cookie        = require('../lib/cookie');

var WebSocketsUser = module.exports = function( params ){
  return this._init( params );
};


WebSocketsUser.users = {};


WebSocketsUser.model = function( clazz ) {
  return ActiveRecord.model( clazz );
}

require('sys').inherits( WebSocketsUser, ActiveRecord );


WebSocketsUser.prototype._init = function ( params ) {
  params = params || {};

  this._authorized = false;
  this._client     = params.client;

  if ( !this._client ) console.log( 'client is null in WebSocketsUser' );

  if ( WebSocketsUser.users[ this._client.sessionId ] ) return WebSocketsUser.users[ this._client.sessionId ];
  WebSocketsUser.users[ this._client.sessionId ] = this;
  
  ActiveRecord.prototype._init.call( this );
  return this;
};


WebSocketsUser.prototype.is_guest = function () {
  return this._authorized;
};


WebSocketsUser.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this._client.request.headers.cookie, cookie_name );
};


WebSocketsUser.prototype.authorize = function () {
  this._authorized = true;
};