var ClientConnection = require('client_connections/client_connection');
var HTTPClient       = require('client_connections/http/http_client');
var http             = require('http');
var path             = require('path');


module.exports = HTTPServer.inherits( ClientConnection );

function HTTPServer( params ) {
  this._init( params );
}


HTTPServer.prototype._init = function( params ) {
  this.super_._init( params );

  this._.port         = params.port || 80;
  this._.upload_dir   = path.resolve( this.app.base_dir, params.upload_dir || '/tmp' );

  this._root_folders  = params.root_folders || {};
  this._server        = null;
};


HTTPServer.prototype.run = function () {

  this._server = global.autodafe.get_server( this.port, this.app );
  if ( !this._server ) return this.log( 'HTTP server not running at port ' + this.port, 'warning' );

  var self = this;
  this._server.on( 'request', function( request, response ) {
    new HTTPClient({
      app         : self.app,
      transport   : self,
      request     : request,
      response    : response
    });
  } );

  this.log( 'HTTP server started at port ' + this.port, 'info' );
};


HTTPServer.prototype.close = function () {
  try{
    if ( this._server ) this._server.close();
  } catch( e ) {
    this.log( e, 'warning' );
  }
};


HTTPServer.prototype.get_root_folder = function ( name ) {
  return this._root_folders[ name ];
};