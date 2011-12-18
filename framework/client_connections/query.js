var url             = require('url');

module.exports = Query.inherits( autodafe.AppModule );

function Query( params ) {
  this._init( params );
}

Query.prototype._init = function( params ) {
  Query.parent._init.call( this, params );

  this.client          = params.client;
  this.connection_type = params.connection_type;
  this.route           = null;
  this.host            = params.host   || '';
  this.url             = params.url ? '//' + this.host + params.url : '';
  this.parsed_url      = url.parse( this.url, true, true );
  this.action          = params.action || this.parsed_url.pathname;
  this.params          = params.params || this.parsed_url.query;
};