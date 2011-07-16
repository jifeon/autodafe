var Client = require('client_connections/client');
var http   = require('http');
var cookie = require('lib/cookie');


module.exports = HTTPClient.inherits( Client );

function HTTPClient( params ) {
  this._init( params );
}


HTTPClient.prototype._init = function( params ) {
  if ( !params || !params.request )
    throw new Error( '`request` should be instance of http.ServerRequest in HTTPClient.init' );
//  this._.request = params.request;
  this.request = params.request;

  if ( !params.response )
    throw new Error( '`response` should be instance of http.ServerResponse in HTTPClient.init' );
//  this._.response = params.response;
  this.response = params.response;
  this.response.cookie = [];

  this.super_._init( params );
};


HTTPClient.prototype.init_events = function () {
  this.super_.init_events();

  var listener = function() {
    this.emit( 'disconnect' );
  }

  this.request.once( 'close', listener );
  this.request.once( 'end',   listener );

  var self = this;
  process.nextTick( function() {
    self.emit( 'request', self.request.url );
  } );
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


HTTPClient.prototype.set_cookie = function ( name, value ) {
  this.response.cookie.push( name + '=' + value + ';path=/' );
};

HTTPClient.prototype.set_cookies = function () {
  this.response.setHeader("Set-Cookie", this.response.cookie );
};


HTTPClient.prototype.send = function ( data ) {
  if( this.response.cookie.length > 0 )
    this.set_cookies();

  this.super_.send( data );

  this.response.end( data, 'utf8' );
};

HTTPClient.prototype.set_url = function ( url ) {
  this.set_cookies();
  this.response.cookie = [];
  this.response.writeHead( 302, { Location : url } );
}

