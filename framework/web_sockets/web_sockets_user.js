var ActiveRecord  = require('ar/active_record');
var cookie        = require('../lib/cookie');

var WebSocketsUser = module.exports = function( params ){
  this._init( params );
};


WebSocketsUser.model = function( clazz ) {
  return ActiveRecord.model( clazz );
}

require('sys').inherits( WebSocketsUser, ActiveRecord );


WebSocketsUser.prototype._init = function ( params ) {
  params = params || {};

  this._authorised = false;
  this._client     = params.client;

  if ( !this._client ) console.log( 'client is null in WebSocketsUser' );

  ActiveRecord.prototype._init.call( this );
};


WebSocketsUser.prototype.is_authorised = function () {
  return this._authorised;
};


WebSocketsUser.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this._client.request.headers.cookie, cookie_name );
};


WebSocketsUser.prototype.authorise = function ( cookie_name, cookie_value ) {
};