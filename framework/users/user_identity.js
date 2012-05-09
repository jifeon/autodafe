var AppModule                 = global.autodafe.AppModule;
var UserIdentityModelHandler  = require('./user_identity_model_handler');
var UserIdentityARHandler     = require('./user_identity_active_record_handler');
var Model                     = global.autodafe.Model;

module.exports = UserIdentity.inherits( AppModule );

function UserIdentity( params ) {
  return this._init( params );
}


UserIdentity.prototype._init = function( params ) {
  UserIdentity.parent._init.call( this, params );

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


UserIdentity.prototype.is_guest = function () {
  return this == this.users_manager.guests;
};


UserIdentity.prototype.is_authorized = function(){
  return !this.is_guest();
};


UserIdentity.prototype.set_model = function ( model ) {
  if ( this.is_guest() ) {
    this.log( 'Try to set model for guests UserIdentity', 'error' );
    return false;
  }

  this._.model = model;
};


UserIdentity.prototype.can = function ( action, model, attribute, params ) {
  return this.users_manager.check_right( this, action, model, attribute, params );
};


UserIdentity.prototype.get_roles = function ( model, attribute, params ) {
  return this.users_manager.get_roles( this, model, attribute, params );
};


UserIdentity.prototype.manage = function ( model, params ) {
  var EE   = process.EventEmitter;
  var self = this;
  if ( model instanceof EE && model.constructor == EE ) {
    var emitter = new EE;

    model
      .on('success', function( result ){
        emitter.emit('success', self.manage( result, params ));
      })
      .re_emit('error', emitter);

    return emitter;
  }

  if ( Array.isArray( model ) ) return model.map( function( model ) {
    return this.manage( model, params );
  }, this );

  if ( !Model.is_instantiate( model ) ) return model;
  var Handler = model.class_name == 'ActiveRecord' ? UserIdentityARHandler : UserIdentityModelHandler;

  var handler = new Handler({
    target        : model,
    user_identity : this,
    params        : params
  });

  return handler.get_proxy();
};


UserIdentity.prototype.is_online = function(){
  return !!this.sessions.length;
};