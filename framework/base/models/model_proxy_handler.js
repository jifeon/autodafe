var ProxyHandler         = require('../../lib/proxy_handlers/proxy_handler');

module.exports = ModelProxyHandler.inherits( ProxyHandler );

function ModelProxyHandler( params ) {
  this._init( params );
}


ModelProxyHandler.prototype.get = function ( receiver, name ) {
  return this.target.get_attribute( name );
};


ModelProxyHandler.prototype.set = function ( receiver, name, value ) {
  return this.target.set_attribute( name, value );
};