var Component         = require( 'components/component' );
var WebSocketsServer  = require( '../web_sockets/web_sockets_server' );
var UserIdentity      = require( './user_identity' );
var WebSocketsUserIdentity  = require( './web_sockets_user_identity' );

var UserIdentities = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( UserIdentities, Component );


UserIdentities.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this._cache = {};

  var self = this;
  this.app.on( 'new_session', function() {
    self._create_user_identity.apply( self, arguments );
  } );
};


UserIdentities.prototype._create_user_identity = function ( session, connector ) {
  var user_identity;

  switch ( connector.constructor ) {
    case WebSocketsServer:
      var ws_client = this.app.web_sockets_server.get_client_by_session_id( session.id );
      if ( !ws_client ) {
        return console.log( 'Warning! web sockets client is not found while creating user identity' );
      }

      user_identity = new WebSocketsUserIdentity({
        client : ws_client
      });
      break;

    default :
      user_identity = new UserIdentity();
      break;
  }

  this._cache[ session.id ] = user_identity;
};


UserIdentities.prototype.get_by_session_id = function ( session_id ) {
  return this._cache[ session_id ] || console.log( 'user with session.id ' + session_id + ' is not found' );
};