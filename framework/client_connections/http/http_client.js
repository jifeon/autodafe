var Client          = require('client_connections/client');
var cookie          = require('lib/cookie');
var formidable      = require('formidable');
var url             = require('url');
var content_types   = require('./content-types');
var fs               = require('fs');


module.exports = HTTPClient.inherits( Client );

function HTTPClient( params ) {
  this._init( params );
}


HTTPClient.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.request )
    throw new Error( '`request` should be instance of http.ServerRequest in HTTPClient.init' );

  if ( !params.response )
    throw new Error( '`response` should be instance of http.ServerResponse in HTTPClient.init' );

  this._.request    = params.request;
  this._.response   = params.response;
  this._.post_form  = null

  this._cookie = [];

  var self        = this;
  var disconnect  = function() { self.disconnect(); }
  this.request.once( 'close', disconnect );
  this.request.once( 'end',   disconnect );
};


HTTPClient.prototype._after_connect = function () {
  this.super_._after_connect();

  this.receive();
};


HTTPClient.prototype.receive = function () {
  var parsed_url      = url.parse( this.request.url, true );
  var matches         = /^\/(.*?)(\/(.*?))?$/.exec( parsed_url.pathname );
  var base_route      = matches && matches[1] || '';
  parsed_url.pathname = matches && matches[3] || '';

  if ( this.request.method.toLowerCase() == 'post' ) this._receive_post( base_route );
  else this._receive_get( base_route, parsed_url );
};


HTTPClient.prototype._receive_post = function ( action ) {
  var self = this;

  this._.post_form = new formidable.IncomingForm;
  this._.post_form.uploadDir      = this.connection.upload_dir;
  this._.post_form.keepExtensions = true;
  this._.post_form.parse( this.request, function( err, fields, files ) {
    if ( err ) return self.send_error( err );

    self.super_.receive( action, Object.merge( fields, files ) );
  });
};


HTTPClient.prototype._receive_get = function ( base_route, parsed_url ) {
  var folder = this.connection.get_root_folder( base_route );
  if ( folder == null ) return this.send_file( path.resolve( this.app.base_dir, folder, parsed_url.pathname ) );

  this.super_.receive( base_route, parsed_url.query );
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
};


HTTPClient.prototype.send = function ( data ) {
  this.response.setHeader( "Set-Cookie", this._cookie );

  this.super_.send( data );

  this.response.end( data, 'utf8' );
};


HTTPClient.prototype.send_file = function ( file_path ) {
  var self = this;

  this.log( 'Send file `%s` to http client ( session id=%s )'.format( file_path, this.get_session_id() ) );

  fs.readFile( file_path, "binary", function( e, file ){
    if( e ){
      e.number = 404;
      return self.send_error( e );
    }

    this.emit( 'send_file', file );
    this.connection.emit( 'send_file', file, this );

    var file_ext  = path.extname( file_path );
    var type      = content_types[ file_ext.toLowerCase() ] || '';

    if ( !type ) this.log( 'Unknown file type of file `%s`'.format( file_path ), 'warning' );

    self.response.writeHead( 200, { "Content-Type": type });
    self.response.write( file, "binary" );
    self.response.end();
  } );
};


HTTPClient.prototype.send_error = function ( e ) {
  this.super_.send_error(e);

  switch ( e.number ) {
    case 403:
      this.log( 'Error 403 by address `%s`'.format( this.request.url ), 'warning' );
      this.response.statusCode = 403;
      this.response.end();
      break;

    case 404:
    default:
      this.log( 'Error 404 by address `%s`'.format( this.request.url ), 'warning' );
      this.response.statusCode = 404;
      this.response.end();
      break;
  }
};


HTTPClient.prototype.redirect = function ( url ) {
  this.response.writeHead( 302, { Location : url } );
}

