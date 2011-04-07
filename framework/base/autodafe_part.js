var Proxy             = require( 'lib/proxy/node-proxy/lib/node-proxy' );
var ForwardingHandler = require( 'lib/proxy/proxy_handler' );

module.exports = AutodafePart.inherits( process.EventEmitter );

function AutodafePart() {
  this._init();
}


AutodafePart.prototype._init = function() {
  var self    = this;
  var handler = ForwardingHandler( this );

  handler.set = function( receiver, name, value ) {
    if ( self[ name ] ) delete this[ name ];

    Object.defineProperty( self, name, {
      get           : function() {
        return value;
      },
      set           : function() {
        throw new TypeError( 'Property `%s` of `%s` is read only'.format( name, self.class_name ) );
      },
      configurable  : false
    } );
  }

  Object.defineProperty( this, '_', {
    value         : Proxy.create( handler ),
    writable      : false,
    configurable  : false
  } );

  this._.class_name = this.constructor.name;
};