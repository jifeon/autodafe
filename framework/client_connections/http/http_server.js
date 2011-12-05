var ClientConnection = require('../client_connection');
var HTTPClient       = require('./http_client');
var http             = require('http');
var path             = require('path');
var auth             = require('http-auth');

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
  this._basic_auth    = params.basic_auth;
};


HTTPServer.prototype.run = function () {
  this._server = global.autodafe.get_server( this.port, this.app );
  if ( !this._server ) return this.log( 'HTTP server not running at port ' + this.port, 'warning' );

  var basic_auth;
  if ( this._basic_auth ) {
    var auth_users = {}, i = 0;
    for ( var user in this._basic_auth.users ) {
      auth_users[ i++ ] = user + ':' + this._basic_auth.users[ user ];
    }

    basic_auth = auth.basic({
      authRealm : this._basic_auth.message || 'Autodafe private area with basic access authentication.',
      authList  : auth_users
    });
  }

  var self = this;
  this._server.on( 'request', function( request, response ) {
    if ( basic_auth ) basic_auth.apply( request, response, self._create_http_client.bind( self, request, response ) );
    else self._create_http_client( request, response );
  } );

  this._server.on( 'close', function( errno ) {
    self.emit( 'close', errno );
  } );

  this.log( 'HTTP server started at port ' + this.port, 'info' );
};


HTTPServer.prototype._create_http_client = function ( request, response ) {
  new HTTPClient({
    app         : this.app,
    connection  : this,
    request     : request,
    response    : response
  });
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