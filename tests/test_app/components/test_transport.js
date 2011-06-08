var ClientConnection = require('client_connections/client_connection');

module.exports = TestTransport.inherits( ClientConnection );

function TestTransport( params ) {
  this._init( params );
}


TestTransport.prototype._init = function( params ) {
  this.super_._init( params );

  
};


TestTransport.prototype.send_response = function ( client, data ) {
  this.emit( 'send_response', client, data );
};


TestTransport.prototype.receive_request = function ( data, session ) {
  this.emit( 'receive_request', data, session );
};


TestTransport.prototype.disconnect_client = function ( client, session ) {
  this.super_.disconnect_client( client, session );
  this.emit( 'disconnect_client', client, session );
};