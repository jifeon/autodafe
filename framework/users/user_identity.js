var AppModule = require('app_module');

module.exports = UserIdentity.inherits( AppModule );

function UserIdentity( params ) {
  return this._init( params );
}

UserIdentity.cache = {};
UserIdentity.with_same_user = {};

UserIdentity.prototype._init = function( params ) {
  this.super_._init( params );

  this._session_id = params.session_id;
  if ( !this._session_id ) {
    this.log( 'session_id is undeifned', 'error' );
    return false;
  }

  if ( UserIdentity.cache[ this._session_id ] ) return UserIdentity.cache[ this._session_id ];
  UserIdentity.cache[ this._session_id ] = this;

  this.user        = null;

  this._authorized = false;

  return this;
};


UserIdentity.prototype.is_guest = function () {
  return !this._authorized;
};


UserIdentity.prototype.authorize = function ( user ) {
  if ( !user || user.id == undefined ) return false;

  this._authorized  = true;
  this.user         = user;

  var similar_identities = UserIdentity.with_same_user;
  if ( !similar_identities[ user.id ] ) similar_identities[ user.id ] = {};
  similar_identities[ user.id ][ this._session_id ] = this;

  return true;
};


UserIdentity.prototype.get_id = function () {
  return this.user.id;
};


UserIdentity.prototype.enum_similar_identities = function ( callback ) {
  var similar_identities = UserIdentity.with_same_user;

  var identities = similar_identities[ this.user.id ];
  for ( var session_id in identities ) {
    if ( this._session_id == session_id ) continue;

    callback.call( identities[ session_id ] );
  }
};


UserIdentity.prototype.get_session_id = function () {
  return this._session_id;
};