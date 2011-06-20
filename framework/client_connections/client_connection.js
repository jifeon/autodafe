var Component = require('components/component');
var Session   = require('session');

module.exports = ClientConnection.inherits( Component );

function ClientConnection( params ) {
  this._init( params );
}


ClientConnection.prototype._init = function ( params ) {
  this.super_._init( params );

  var self = this;
  this.app.on( 'run', function() {
    self.run();
  } );

  this.app.on( 'close', function() {
    self.close();
  } );
};


ClientConnection.prototype.connect_client = function ( client, session_id ) {
  var self    = this;
  var session = this.app.create_session( session_id, client );

  client.on( 'request', function( request ) {
    self.receive_request( request, session );
  } );

  client.on( 'disconnect', function() {
    self.disconnect_client( client, session );
  } );

  this.app.router.route( this.app.default_controller + '.connect_client', session );
};


ClientConnection.prototype.receive_request = function ( request ) {};
ClientConnection.prototype.send_response = function ( client, data ) {};
ClientConnection.prototype.run = function () {};
ClientConnection.prototype.close = function () {};


ClientConnection.prototype.disconnect_client = function ( client, session ) {
  session.close();
};