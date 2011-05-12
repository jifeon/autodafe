var Component         = require( 'components/component' );
var WebSocketsServer  = require( 'client_connections/web_sockets/web_sockets_server' );
var UserIdentity      = require( './user_identity' );
var WebSocketsUserIdentity  = require( 'client_connections/web_sockets/web_sockets_user_identity' );

module.exports = UsersManager.inherits( Component );

function UsersManager( params ) {
  this._init( params );
}


UsersManager.prototype._init = function( params ) {
  this.super_._init( params );

  this._cache = {};

  var self = this;
  this.app.on( 'new_session', function() {
    self._create_user_identity.apply( self, arguments );
  } );
};


UsersManager.prototype._create_user_identity = function ( session, connector ) {
  var user_identity;

  switch ( connector.constructor ) {
    case WebSocketsServer:
      var ws_client = this.app.web_sockets_server.get_client_by_session_id( session.id );
      if ( !ws_client ) {
        return this.log( 'Web sockets client is not found while creating user identity', 'error' );
      }

      user_identity = new WebSocketsUserIdentity({
        client : ws_client,
        app    : this.app
      });
      break;

    default :
      user_identity = new UserIdentity({
        app    : this.app
      });
      break;
  }

  this._cache[ session.id ] = user_identity;
};


UsersManager.prototype.get_by_session_id = function ( session_id ) {
  var ui = this._cache[ session_id ];
  if ( !ui ) this.log( 'User with session.id "%s" is not found'.format( session_id ), 'warning' );
  return ui || null;
};