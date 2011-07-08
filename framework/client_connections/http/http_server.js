var ClientConnection = require('client_connections/client_connection');
var HTTPClient       = require('client_connections/http/http_client');
var http             = require('http');
var url              = require('url');

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
  this._server = global.autodafe.get_server( this.port, this.app );
  this._server.on( 'request', function( request, response ) {
    self.connect_client( new HTTPClient({
      app       : self.app,
      transport : self,
      request   : request,
      response  : response
    }) );
  } );
};


HTTPServer.prototype.close = function () {
  if ( this._server ) this._server.close();
};


HTTPServer.prototype._receive_request = function ( url_str, client ) {
  var parsed_url = url.parse( url_str );

  var action = parsed_url.pathname.substr(1).replace( /\//g, '.' );
  var data = {
    action : action,
    params : {}
  };

  this.super_._receive_request( data, client );
};