var Component         = global.autodafe.Component;
var UserIdentity      = require( './user_identity' );
var RolesSet          = require( './roles_set' );
var ModelsRolesSet    = require( './models_roles_set' );

module.exports = UsersManager.inherits( Component );

function UsersManager( params ) {
  this._init( params );
}


UsersManager.prototype._init = function( params ) {
  this.super_._init( params );

  this.rights = {
    global : null,
    models : {}
  };

  this._init_roles( params );

  this._users = {
    by_session_id : {},
    by_model_id   : {}
  };

  this._.guests = new UserIdentity({
    app           : this.app,
    users_manager : this
  });

  var self = this;
  this.app.on( 'new_session', function( session ) {
    self._register_guest_session( session );
  } );
};


UsersManager.prototype._init_roles = function ( params ) {
  this.rights.global = new RolesSet( params );

  this.app.models.for_each_model( function( model ){
    var models_roles        = typeof model.users_rights == 'function' ? model.users_rights() || {} : {};
    models_roles.app        = this.app;
    models_roles.parent_set = this.rights.global;
    this.rights.models[ model.class_name ] = new ModelsRolesSet( models_roles );
  }, this );
};


UsersManager.prototype.check_right = function ( user_identity, action, model, attribute, params ) {
  var roles_set = this._get_roles_set( model );
  return roles_set.check_right( user_identity, action, model, attribute, params );
};


UsersManager.prototype.get_roles = function ( ui, model, attribute, params ) {
  var roles_set = this._get_roles_set( model );
  return roles_set.get_roles( ui, model, attribute, params );
};


UsersManager.prototype._get_roles_set = function ( model ) {
  return model ? this.rights.models[ model.class_name ] : this.rights.global;
};


UsersManager.prototype._register_guest_session = function ( session ) {
  if ( !session.is_active ) {
    this.log( 'Can\'t create UserIdentity for closed session', 'warning' );
    return false;
  }

  var users = this._users;
  if ( users.by_session_id[ session.id ] ) {
    this.app.log( 'Try to register double guest session (id=%s)'.format( session.id ), 'warning' );
    return false;
  }

  this.guests.register_session( session );
  users.by_session_id[ session.id ] = this.guests;

  session.once( 'close', function() {
    delete users.by_session_id[ session.id ];
  } );
};


UsersManager.prototype.get_by_session = function ( session ) {
  return this._users.by_session_id[ session.id ] || null;
};


UsersManager.prototype.get_by_client = function ( client ) {
  return this.get_by_session( client.session );
};


UsersManager.prototype.get_by_model = function ( model ) {
  if ( !model ) return null;
  return this.get_by_model_id( model.id );
};


UsersManager.prototype.get_by_model_id = function ( id ) {
  return this._users.by_model_id[ id ] || null;
};


UsersManager.prototype.authorize_session = function ( session, model ) {
  var guests_ui = this.get_by_session( session );
  if ( guests_ui && guests_ui != this.guests ) {
    if ( guests_ui.model != model ) this.logout_session( session );
    else {
      this.log( 'Try to double authorize session with id = %s'.format( session.id ), 'warning' );
      return false;
    }
  }

  if ( guests_ui ) guests_ui.remove_session( session );

  var ui = this.get_by_model( model );

  if ( !ui ){
    ui = new UserIdentity({
      app           : this.app,
      users_manager : this
    });

    ui.set_model( model );
    this._users.by_model_id[ model.id ] = ui;
  }

  ui.register_session( session );
  this._users.by_session_id[ session.id ] = ui;

  var self = this;
  // if user did not was in guests we should add handler on session close
  if ( !guests_ui ) session.once( 'close', function() {
    delete self._users.by_session_id[ session.id ];
  } );
};


UsersManager.prototype.logout_session = function ( session ) {
  var ui = this.get_by_session( session );
  if ( ui == this.guests ) {
    this.log( 'Try to log out by guest. Session id = %s'.format( session.id ), 'warning' );
    return false;
  }

  if ( ui ) ui.remove_session( session );

  this.guests.register_session( session );
  this._users.by_session_id[ session.id ] = this.guests;

  var self = this;
  if ( !ui ) session.once( 'close', function() {
    delete self._users.by_session_id[ session.id ];
  } );
};


UsersManager.prototype.get_clients_by_model_id = function( id ){
  var clients = [];
  var ui      = this.get_by_model_id( id );
  if ( !ui ) return [];

  return ui.sessions.reduce( function( clients, session ){
    Array.prototype.push.apply( clients, session.clients );
    return clients;
  }, [] );
};