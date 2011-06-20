var Client = require('client_connections/client');

module.exports = HTTPClient.inherits( Client );

function HTTPClient( params ) {
  this._init( params );
}


HTTPClient.prototype._init = function( params ) {
  this.super_._init( params );

  
};