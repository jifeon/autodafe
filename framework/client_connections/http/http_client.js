var Client          = require('../client');
var cookie          = require('../../lib/cookie');
var formidable      = require('formidable');
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
  this.post_form  = null;
  this.max_age    = 31536000;

  this._cookie = [];
  this._sid    = this.get_session_id();

  this.request.once( 'close', this.disconnect.bind( this ) );

  HTTPClient.parent._init.call( this, params  );

  this.connection.once( 'close',  this.disconnect.bind( this ) );
  this.receive();
};


HTTPClient.prototype.receive = function () {
  var query = this.create_query( {
    url             : this.request.url,
    host            : this.request.headers.host,
    connection_type : this.request.method.toLowerCase()
  });

  if ( query.connection_type == 'post' ) this._receive_post( query );
  else this._receive_get( query );
};


HTTPClient.prototype._receive_post = function ( query ) {
  var self = this;

  this._.post_form              = new formidable.IncomingForm;
  this.post_form.uploadDir      = this.connection.upload_dir;
  this.post_form.keepExtensions = true;
  try {
    this.post_form.parse( this.request, function( e, fields, files ) {
      if ( e ) return self.send_error( e );

      query.params = Object.merge( fields, files );

      if ( self.connected )    HTTPClient.parent.receive.call( self, query  );
      else self.on( 'connect', HTTPClient.parent.receive.bind( self, query  ) );
    });
  }
  catch( e ) { this.send_error( e ); }
};


HTTPClient.prototype._receive_get = function ( query ) {
  // check root folder: /folder/path/to/file
  var matches = /^\/(.*?)(\/(.*))?$/.exec( query.parsed_url.pathname );
  var folder  = this.connection.get_root_folder( matches && matches[1] || '' );
  if ( folder != null ) return this.send_file( path.resolve( this.app.base_dir, folder, matches && matches[3] || '' ) );

  if ( this.connected )    HTTPClient.parent.receive.call( this, query  );
  else this.on( 'connect', HTTPClient.parent.receive.bind( this, query  ) );
};


HTTPClient.prototype.end = function ( data, encoding ) {
  this.response.end( data, encoding );
  this.disconnect();
};


HTTPClient.prototype.get_session_id = function () {
  var sid = this._sid || this.get_cookie( 'autodafe_sid' );

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
  HTTPClient.parent.send.call( this, data  );
  this.end( data, 'utf8' );
};


HTTPClient.prototype.send_file = function ( file_path, headers, callback ) {
  var self = this;

  if ( typeof callback != 'function' ) callback = function( e ){
    if (e) self.send_error( e, 404 );
  }

  fs.stat( file_path, function( e, stats ) {
    if ( e ) return callback( e );

    var modify_time = new Date( self.request.headers[ 'if-modified-since' ] );
    if ( modify_time.getTime() == stats.mtime.getTime() ){
      self.log( '304. File `%s` not modified ( session id=%s )'.format( file_path, self.get_session_id() ) );
      self.response.writeHead( 304, {
        'Cache-Control' : 'max-age=' + self.max_age
      });

      return self.end();
    }

    fs.readFile( file_path, "binary", function( e, file ){
      if ( e ) return callback( e );

      self.log( 'Send file `%s` to http client ( session id=%s )'.format( file_path, self.get_session_id() ) );
      self.emit( 'send_file', file );
      self.connection.emit( 'send_file', file, this );

      var file_ext  = path.extname( file_path );
      var type      = content_types[ file_ext.toLowerCase().substr(1) ] || '';

      if ( !type ) self.log( 'Unknown file type of file `%s`'.format( file_path ), 'warning' );

      headers = Object.merge( {
        'Content-Type'  : type,
        'Cache-Control' : 'max-age=' + self.max_age,
        'Last-Modified' : stats.mtime.toUTCString()
      }, headers );

      self.response.writeHead( 200, headers );

      self.end( file, "binary" );
      callback( null, file );
    } )
  } );
};


HTTPClient.prototype.send_error = function ( e, number ) {
  if ( typeof e == 'string' ) e = new Error( e );
  e.number = e.number || number || 500;

  HTTPClient.parent.send_error.call( this, e );

  this.log( 'Error %s by address `%s`'.format( e.number, this.request.url ), 'warning' );
  this.response.statusCode = e.number;

  try {
    var query = this.create_query({ action : '/' + e.number });
    this.app.router.route( query );
  }
  catch( err ) {
    this.end( '<h1>Error %s. %s</h1>'.format( e.number, this.errors[ e.number ] || '' ), 'utf8' );
  }
};


HTTPClient.prototype.redirect = function ( url ) {
  this.response.writeHead( 302, { Location : url } );
  this.end();
}

