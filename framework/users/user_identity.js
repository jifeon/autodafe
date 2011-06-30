var AppModule                 = require('app_module');
var UserIdentityModelHandler  = require('./user_identity_model_handler');

module.exports = UserIdentity.inherits( AppModule );

function UserIdentity( params ) {
  return this._init( params );
}


UserIdentity.prototype._init = function( params ) {
  this.super_._init( params );

  var UsersManager = require('./users_manager');
  if ( !UsersManager.is_instantiate( params.users_manager ) ) throw new Error(
    '`users_manager` should be instance of UsersManager in UserIdentity.init'
  );

  this._.users_manager  = params.users_manager;
  this._.sessions       = [];
  this._.model          = null;
};


UserIdentity.prototype.register_session = function ( session ) {
  if ( ~this.sessions.indexOf( session ) ) {
    this.log( 'Try to register same session', 'warning' );
    return false;
  }

  this.sessions.push( session );
  var self = this;
  session.once( 'close', function() {
    self.remove_session( session );
  } );
};


UserIdentity.prototype.remove_session = function ( session ) {
  var cid = this.sessions.indexOf( session );
  if ( cid != -1 ) this.sessions.splice( cid, 1 );
};


UserIdentity.prototype.set_model = function ( model ) {
  if ( this == this.users_manager.guests ) {
    this.log( 'Try to set model for guests\' UserIdentity', 'error' );
    return false;
  }

  this._.model = model;
};


UserIdentity.prototype.manage = function ( model ) {
  var handler = new UserIdentityModelHandler({
    target        : model,
    user_identity : this
  });

  return handler.get_proxy();
};