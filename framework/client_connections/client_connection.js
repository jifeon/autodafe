var Component = require('components/component');

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
};


ClientConnection.prototype.run = function () {};


ClientConnection.prototype.connect_client = function ( client ) {
  var self = this;

  client.on( 'request', function( request ) {
    self.receive_request( request, client );
  } );

  client.on( 'disconnect', function() {
    self.disconnect_client( client );
  } );

  client.on( 'send', function( data ) {
    self.send_response( data, client );
  } );

  this.app.router.route( this.app.default_controller + '.connect_client', client );
};


ClientConnection.prototype.receive_request = function ( data, client ) {
  this.emit( 'receive_request', data );

  this.log( 'Message has been received. session_id = "%s"'.format( client.session.id ) );
  this.app.router.route( data.action, data.params, client );
};


ClientConnection.prototype.send_response = function ( data, client ) {
  this.emit( 'send_response', client, data );
};


ClientConnection.prototype.disconnect_client = function ( client ) {
  this.emit( 'disconnect_client', client );
};