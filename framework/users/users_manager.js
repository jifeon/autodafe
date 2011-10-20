var Component         = require( 'components/component' );
var UserIdentity      = require( './user_identity' );
var RolesSet          = require( './roles_set' );
var ModelsRolesSet    = require( './models_roles_set' );

module.exports = UsersManager.inherits( Component );

function UsersManager( params ) {
  this._init( params );
}


UsersManager.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.model || !this.app.models.is_model_exist( params.model ) )
    throw new Error( 'Please bind `users` component to one of exist models of application' );

  this.roles_set       = null;
  this.models_roles    = {};

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
  this.roles_set = new RolesSet( params );

  this.app.models.for_each_model( function( model ){
    var models_roles        = typeof model.users_rights == 'function' ? model.users_rights() || {} : {};
    models_roles.app        = this.app;
    models_roles.parent_set = this.roles_set;
    models_roles.model      = params.model;
    this.models_roles[ model.class_name ] = new ModelsRolesSet( models_roles );
  }, this );
};


UsersManager.prototype.check_right = function ( user_identity, action, model, attribute ) {
  var roles_set = model ? this.models_roles[ model.class_name ] : this.roles_set;
  return roles_set.check_right( user_identity, action, model, attribute );
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


UsersManager.prototype.authorize_session = function ( session, model ) {
  var guests_ui = this.get_by_session( session );
  if ( guests_ui && guests_ui != this.guests ) {
    this.log( 'Try to double authorize session with id = %s'.format( session.id ), 'warning' );
    return false;
  }

  if ( guests_ui ) this.guests.remove_session( session );

  var new_ui = new UserIdentity({
    app           : this.app,
    users_manager : this
  });

  new_ui.register_session( session );
  new_ui.set_model( model );

  this._users.by_session_id[ session.id ] = new_ui;
  if( this._users.by_model_id[ model.id ] ){
    if( this._users.by_model_id[ model.id ].indexOf( session ) == -1 )
      this._users.by_model_id[ model.id ].push( session );
  }
    else this._users.by_model_id[ model.id ] = [ session ];

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
  if( this._users.by_model_id[ id ] )
    for( var s = 0, ln_s = this._users.by_model_id[ id ].length; s < ln_s; s++ )
      clients = clients.concat( this._users.by_model_id[ id ][ s ].clients );
  return clients;
};