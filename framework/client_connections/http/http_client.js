var Client          = require('client_connections/client');
var cookie          = require('lib/cookie');
var formidable      = require('formidable');
var url             = require('url');
var content_types   = require('./content-types');
var fs              = require('fs');
var path            = require('path');


module.exports = HTTPClient.inherits( Client );

function HTTPClient( params ) {
  this._init( params );
}


HTTPClient.prototype.errors = {
  403 : 'Access denied',
  404 : 'Page not found',
  500 : 'Internal Server Error'
};


HTTPClient.prototype._init = function( params ) {
  if ( !params || !params.request )
    throw new Error( '`request` should be instance of http.ServerRequest in HTTPClient.init' );

  if ( !params.response )
    throw new Error( '`response` should be instance of http.ServerResponse in HTTPClient.init' );

  this.request    = params.request;
  this.response   = params.response;
  this.post_form  = null

  this._cookie = [];

  this.request.once( 'close', this.disconnect.bind( this ) );
  this.request.once( 'end',   this.disconnect.bind( this ) );

  this.super_._init( params );

  this.receive();
};


HTTPClient.prototype.receive = function () {
  var parsed_url      = url.parse( this.request.url, true );

  if ( this.request.method.toLowerCase() == 'post' ) this._receive_post( parsed_url.pathname );
  else this._receive_get( parsed_url );
};


HTTPClient.prototype._receive_post = function ( path ) {
  var self = this;

  this._.post_form              = new formidable.IncomingForm;
  this.post_form.uploadDir      = this.connection.upload_dir;
  this.post_form.keepExtensions = true;
  try {
    this.post_form.parse( this.request, function( e, fields, files ) {
      if ( e ) return self.send_error( e );

      var params = Object.merge( fields, files );
      if ( self.connected ) self.super_.receive( path, params, 'post' );
      else self.on( 'connect', self.super_.receive.bind( self, path, params, 'post' ) );

    });
  }
  catch( e ) { this.send_error( e ); }
};


HTTPClient.prototype._receive_get = function ( parsed_url ) {
  // check root folder: /folder/path/to/file
  var pathname    = parsed_url.pathname;
  var matches = /^\/(.*?)(\/(.*))?$/.exec( pathname );
  var folder  = this.connection.get_root_folder( matches && matches[1] || '' );
  if ( folder != null ) return this.send_file( path.resolve( this.app.base_dir, folder, matches && matches[3] || '' ) );

  var params = parsed_url.query;
  var method = this.request.method.toLowerCase();
  if ( this.connected ) this.super_.receive( pathname, params, method );
  else this.on( 'connect', this.super_.receive.bind( this, pathname, params, method ) );
};


HTTPClient.prototype.get_session_id = function () {
  var sid = this.get_cookie( 'autodafe_sid' );

  if ( !sid ) {
    sid = String.unique();
    this.set_cookie( 'autodafe_sid', sid );
  }

  return sid;
};


HTTPClient.prototype.get_cookie = function ( name ) {
  return cookie.read( this.request.headers.cookie, name );
};


HTTPClient.prototype.set_cookie = function ( name, value, days ) {
  this._cookie.push( cookie.make( name, value, days ) );
  try{
    this.response.setHeader( "Set-Cookie", this._cookie );
  } catch ( e ) {
    this.log( e );
  }
};


HTTPClient.prototype.send = function ( data ) {
  this.super_.send( data );
  this.response.end( data, 'utf8' );
};


HTTPClient.prototype.send_file = function ( file_path ) {
  var self = this;

  this.log( 'Send file `%s` to http client ( session id=%s )'.format( file_path, this.get_session_id() ) );

  fs.readFile( file_path, "binary", function( e, file ){
    if( e ) self.send_error( e, 404 );

    self.emit( 'send_file', file );
    self.connection.emit( 'send_file', file, this );

    var file_ext  = path.extname( file_path );
    var type      = content_types[ file_ext.toLowerCase().substr(1) ] || '';

    if ( !type ) self.log( 'Unknown file type of file `%s`'.format( file_path ), 'warning' );

    self.response.writeHead( 200, { "Content-Type": type });
    self.response.write( file, "binary" );
    self.response.end();
  } );
};


HTTPClient.prototype.send_error = function ( e, number ) {
  if ( typeof e == 'string' ) e = new Error( e );
  e.number = e.number || number || 500;

  this.super_.send_error(e);

  this.log( 'Error %s by address `%s`'.format( e.number, this.request.url ), 'warning' );
  this.response.statusCode = e.number;

  try {
    this.app.router.route( '/' + e.number, null, this );
  }
  catch( err ) {
    this.response.end( '<h1>Error %s. %s</h1>'.format( e.number, this.errors[ e.number ] || '' ) );
  }
};


HTTPClient.prototype.redirect = function ( url ) {
  this.response.writeHead( 302, { Location : url } );
  this.response.end();
}

