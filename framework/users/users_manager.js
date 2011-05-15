var Component         = require( 'components/component' );
var WebSocketsServer  = require( 'client_connections/web_sockets/web_sockets_server' );
var UserIdentity      = require( './user_identity' );

module.exports = UsersManager.inherits( Component );

function UsersManager( params ) {
  this._init( params );
}


UsersManager.prototype._init = function( params ) {
  this.super_._init( params );

  this._users = {
    by_session_id : {},
    by_id         : {},
    guests        : []
  };

  var self = this;
  this.app.on( 'new_session', function( session ) {
    self._create_user_identity( session );
  } );
};


UsersManager.prototype.get = function ( session ) {
  return this._users.by_session_id[ session.id ] || null;
};


UsersManager.prototype.for_authorized = function ( callback ) {
  var users = this._users.by_id;

  for ( var id in users ) {
    var first_key = Object.keys( users[ id ] )[0];
    callback( users[ id ][ first_key ] );
  }
};


UsersManager.prototype.for_guests = function ( callback ) {
  this._users.guests.forEach( callback );
};


UsersManager.prototype.for_each = function ( callback ) {
  this.for_authorized( callback );
  this.for_guests( callback );
};


UsersManager.prototype._create_user_identity = function ( session ) {
  if ( !session.is_active )
    return this.log( 'Can\'t create UserIdentity for closed session', 'warning' );

  var users = this._users;
  if ( users.by_session_id[ session.id ] ) {
    this.app.log( 'Try to create UserIdentity with same sessions (id=%s)'.format( session.id ), 'warning' );
    return false;
  }

  var user = new UserIdentity( {
    app       : this.app,
    session   : session,
    users_map : users.by_id
  } );

  users.by_session_id[ session.id ] = user;
  users.guests.push( user );

  var self = this;

  user.on( 'authorize', function() {
    if ( !users.by_id[ user.id ] ) users.by_id[ user.id ] = {};
    users.by_id[ user.id ][ user.session.id ] = user;
    self._remove_user_from_guest( user );
  } );

  session.on( 'close', function() {
    self._remove_user_identity( user );
  } );
};


UsersManager.prototype._remove_user_identity = function ( user ) {
  var users = this._users;

  delete users.by_session_id[ user.session.id ];
  if ( user.is_guest ) this._remove_user_from_guest( user );
  else delete users.by_id[ user.id ][ user.session.id ];
};


UsersManager.prototype._remove_user_from_guest = function ( user ) {
  var i = this._users.indexOf( user );
  if ( i != -1 ) this._users.splice( i, 1 );
};