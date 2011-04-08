var ProxyHandler = require('./proxy_handler');

module.exports = ProtectedValuesProxyHandler;

function ProtectedValuesProxyHandler( params ) {
  this._init( params );
}

require('util').inherits( ProtectedValuesProxyHandler, ProxyHandler );


ProtectedValuesProxyHandler.prototype.set = function ( receiver, name, value ) {
  if ( this.target[ name ] ) delete this[ name ];

  Object.defineProperty( this.target, name, {
    get           : function() {
      return value;
    },
    set           : function() {
      throw new TypeError( 'Property `%s` of `%s` is read only'.format( name, this.target.class_name ) );
    },
    configurable  : false
  } );
};