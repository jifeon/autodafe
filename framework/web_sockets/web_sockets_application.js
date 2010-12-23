var Application = require('application');
var io          = require('./Socket.IO');
var UI          = require('./web_sockets_user_identity');


var WebSocketsApplication = module.exports = function( config ) {
  this._init( config );
};


require('sys').inherits( WebSocketsApplication, Application );


WebSocketsApplication.prototype._init = function ( config ) {
  require.paths.unshift( __dirname );

  Application.prototype._init.call( this, config );
};


WebSocketsApplication.prototype.run = function ( config ) {
  this.__io = null;

  Application.prototype.run.call( this );

  this.__io = io.listen( this._server );

  var self = this;
  this.__io.on( 'connection', function( client ) {
    self._on_connect( client );
  } );
};


WebSocketsApplication.prototype._on_connect = function ( client ) {
  var self = this;
  var user_identity = new UI({
    client : client
  });


  client.on( 'message', function( message ) {
    self._on_message( message, user_identity );
  } );

  client.on( 'disconnect', function() {
    self._on_disconnect( user_identity );
  } );

  this._router.route( this.default_controller + '/client_connect', user_identity );
};


WebSocketsApplication.prototype._on_message = function ( message, user_identity ) {
  var data          = JSON.parse( message );

  if ( !data ) return console.log( 'Message: "' + message + '" is not in JSON' );

  console.log( 'WebSocket message has been received. user.id = ' + user_identity.get_id() +
               ', session_id = ' + user_identity.get_session_id() );
  this._router.route( data.action, data.params, user_identity );
};


WebSocketsApplication.prototype._on_disconnect = function ( user_identity ) {

};