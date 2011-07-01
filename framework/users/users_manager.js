var Component         = require( 'components/component' );
var UserIdentity      = require( './user_identity' );

module.exports = UsersManager.inherits( Component );

function UsersManager( params ) {
  this._init( params );
}


UsersManager.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.model || !this.app.models.is_model_exist( params.model ) )
    throw new Error( 'Please bind `users` component to one of exist models of application' );

  this._.model_name             = params.model;
  this._.model                  = null;
  this._.roles                  = {};
  this._.default_possibilities  = {};

  this._init_roles( params );
  this._init_possibilities( params );

  this._users = {
    by_session_id : {}
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
  var self = this;

  this.roles.guest = function( model ) {
    return !model;
  };

  this.roles.author = function() {
    return false;
  };

  for ( var role in params.roles ) {
    var role_determinant = params.roles[ role ];

    switch ( typeof role_determinant ) {
      case 'function':
        this.roles[ role ] = role_determinant;
        break;

      case 'string':
        try {
          this.roles[ role ] = new Function(
            this.model_name, 'app', 'model', 'attribute',
            'return ' + role_determinant
          );
        }
        catch ( e ) {
          throw new Error(
            'You have syntax error in users.role definition. Check your config file ( components.users.roles.%s )'.format( role )
          );
        }
        break;

      default : throw new Error(
        'Value of `components.users.roles.%s` hash in your config file should be Strings or Functions'.format( role )
      );
    }
  }
};


UsersManager.prototype.get_roles = function ( user_identity, target_model, target_attribute ) {
  var roles = [];

  for ( var role in this.roles )
    if ( this.roles[ role ]( user_identity.model, this.app, target_model, target_attribute ) )
      roles.push( role );
};


UsersManager.prototype._init_possibilities = function ( params ) {
  if ( !params.possibilities ) params.possibilities = {};

  for ( var role in this.roles )
    this.default_possibilities[ role ] = params.possibilities[ role ] || [];
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

  var self = this;
  // if user did not was in guests we should add handler on session close
  if ( !guests_ui ) session.once( 'close', function() {
    delete self._users.by_session_id[ session.id ];
  } );
};