var Application = require('application');
var io          = require('./Socket.IO');
var WSUser      = require('./web_socket_user');


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
  var user = new WSUser({
    client : client
  });


  client.on( 'message', function( message ) {
    self._on_message( message, user );
  } );

  client.on( 'disconnect', function() {
    self._on_disconnect( user );
  } );

  this._router.route( this.default_controller + '/client_connect', [ user ] );
  client.send( 'OK' );
};


WebSocketsApplication.prototype._on_message = function ( message, client ) {
  var data = JSON.parse( message );

  if ( !data ) return console.log( 'Message: "' + message + '" is not in JSON' );

  this._router.route( data.action, data.params, client );
};


WebSocketsApplication.prototype._on_disconnect = function ( client ) {

};