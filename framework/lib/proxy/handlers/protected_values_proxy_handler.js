var ProxyHandler              = require('./proxy_handler');
var ProtectedValuesDescriptor = require('./protected_values_descriptor');

module.exports = ProtectedValuesProxyHandler;

function ProtectedValuesProxyHandler( params ) {
  this.properties = {};

  this._init( params );
}

require('util').inherits( ProtectedValuesProxyHandler, ProxyHandler );


ProtectedValuesProxyHandler.prototype.set = function ( receiver, name, value ) {
  var descriptor = this.properties[ name ];

  if ( descriptor ) {
    descriptor.value = value;
    descriptor.reset();
  }
  else {
    this._create_handler( name, value );
  }
};


ProtectedValuesProxyHandler.prototype.get = function ( receiver, name ) {
  if ( !this.properties[ name ] ) this._create_handler( name, undefined );

  return this.properties[ name ];
};


ProtectedValuesProxyHandler.prototype['delete'] = function ( name ) {
  var descriptor = this.properties[ name ];

  if ( !descriptor ) return true;

  return descriptor['delete']();
};


ProtectedValuesProxyHandler.prototype._create_handler = function ( name, value ) {
  var descriptor = this.properties[ name ] = this._create_descriptor( name, value );
  var target     = this.target;

  var handler = {
    get           : function() {
      return descriptor.get.call( target, descriptor );
    },
    set           : function( value ) {
      descriptor.set.call( target, value, descriptor );
    },
    configurable  : false
  };

  Object.defineProperty( target, name, handler );
};


ProtectedValuesProxyHandler.prototype._create_descriptor = function ( name, value ) {
  return new ProtectedValuesDescriptor({
    name    : name,
    target  : this.target,
    value   : value
  });
};