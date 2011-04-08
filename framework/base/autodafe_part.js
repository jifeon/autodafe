var ProtectedValuesProxyHandler = require( 'lib/proxy/protected_values_proxy_handler' );

module.exports = AutodafePart.inherits( process.EventEmitter );

function AutodafePart() {
  this._init();
}


AutodafePart.prototype._init = function() {
  var handler = new ProtectedValuesProxyHandler( {
    target : this
  } );

  Object.defineProperty( this, '_', {
    value         : handler.get_proxy(),
    writable      : false,
    configurable  : false
  } );

  this._.class_name = this.constructor.name;
};