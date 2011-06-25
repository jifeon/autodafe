var ClientConnection = require('client_connections/client_connection');
var HTTPClient       = require('client_connections/http/http_client');
var http             = require('http');

module.exports = HTTPServer.inherits( ClientConnection );

function HTTPServer( params ) {
  this._init( params );
}


HTTPServer.prototype._init = function( params ) {
  this.super_._init( params );

  this._.port = params.port || 80;

  this._server = null;
};

HTTPServer.prototype.run = function () {
  var self = this;
  this._server = http.createServer( function( request, response ) {
    var client = new HTTPClient({
      app       : self.app,
      transport : self,
      request   : request,
      response  : response
    });

    if ( !client.session_id ) client.session_id = String.unique();

    self.connect_client( client, client.session_id );
  } );

  this._server.listen( this.port );
};


HTTPServer.prototype.close = function () {
  if ( this._server ) this._server.close();
};


HTTPServer.prototype.send_response = function ( client, data ) {
  this.log( 'Send message to http client ( id=%s )'.format( client.session_id ) );

  client.response.end( data, 'utf8' );
};


HTTPServer.prototype.receive_request = function ( data, session ) {
  this.log( 'HTTP message has been received. session_id = "%s"'.format( session.id ) );
  this.app.router.route( data.action, data.params, session.client, session );
};