var Client = require('client_connections/client');
var http   = require('http');
var url    = require('url');

module.exports = HTTPClient.inherits( Client );

function HTTPClient( params ) {
  this._init( params );
}


HTTPClient.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.request )
    throw new Error( '`request` should be instance of http.ServerRequest in HTTPClient.init' );
  this._.request = params.request;

  if ( !params.response )
    throw new Error( '`response` should be instance of http.ServerResponse in HTTPClient.init' );
  this._.response = params.response;

  this.process_request();
};


HTTPClient.prototype.process_request = function() {
  var parsed_url = url.parse( this.request.url );

  var route = parsed_url.pathname.split('/');
  this.emit( 'request', {

  } );
};
