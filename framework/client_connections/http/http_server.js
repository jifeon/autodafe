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

    self.connect_client();
  } );

  this._server.listen( this.port );
};


HTTPServer.prototype.close = function () {
  if ( this._server ) this._server.close();
};


