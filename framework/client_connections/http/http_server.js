var ClientConnection = require('client_connections/client_connection');
var HTTPClient       = require('client_connections/http/http_client');
var http             = require('http');
var url              = require('url');
var formidable       = require('formidable');


module.exports = HTTPServer.inherits( ClientConnection );

function HTTPServer( params ) {
  this._init( params );
}


HTTPServer.prototype._init = function( params ) {
  this.super_._init( params );

  this._.port = params.port || 80;
  this.uploadDir = params.uploadDir || '/tmp';

  this._server = null;
};

HTTPServer.prototype.run = function () {
  var self = this;
  this._server = global.autodafe.get_server( this.port, this.app );
  this._server.on( 'request', function( request, response ) {
    if (request.method.toLowerCase() == 'post') {
      // parse a file upload

      var form = new formidable.IncomingForm();
      form.uploadDir = self.uploadDir;

      form.parse( request, function( err, fields, files ) {
        request.postError = err;
        request.postData =  fields;
        request.postFiles = files;

        self.connect_client( new HTTPClient({
          app       : self.app,
          transport : self,
          request   : request,
          response  : response
        }) );
      });
      return;
    }
    self.connect_client( new HTTPClient({
      app       : self.app,
      transport : self,
      request   : request,
      response  : response
    }) );
  } );

  this.log( 'HTTP server started at port ' + this.port, 'info' );
};


HTTPServer.prototype.close = function () {
//  if ( this._server ) this._server.close();
};


HTTPServer.prototype._receive_request = function ( url_str, client ) {
  var parsed_url = url.parse( url_str );
  var action = parsed_url.pathname.substr(1).replace( /\//g, '.' );
  var params = ( client.request.method.toLowerCase() == 'post' ) ? client.request.postData  :
       require('querystring').parse( parsed_url.query );
  if( !Object.isEmpty( client.request.postFiles ) ) params.files = client.request.postFiles;
  var data = {
    action : action,
    params : params
  };

  this.super_._receive_request( data, client );
};