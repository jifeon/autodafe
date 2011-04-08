var ProxyHandler = require('./proxy_handler');

module.exports = InheritingProxyHandler;

function InheritingProxyHandler( params ) {
  this._init( params );
}

require('util').inherits( InheritingProxyHandler, ProxyHandler );


InheritingProxyHandler.prototype._init = function ( params ) {
  ProxyHandler.prototype._init.call( this, params );

  this.context = params.context;
};


InheritingProxyHandler.prototype.get = function ( receiver, name ) {
  var self = this;

  return typeof this.target[name] != 'function'
    ? this.target[name]
    : function() {

        var super_prototype = self.target;
        var caller          = arguments.callee.caller;
        var calling_chain   = caller.chain || [ caller ];

        while (
          !super_prototype.hasOwnProperty( name ) ||
          calling_chain.indexOf( super_prototype[ name ] ) != -1
        ) {
          try {
            super_prototype = super_prototype.constructor.super_.prototype;
          }
          catch ( e ) {
            throw new TypeError( name + ' is not a function' );
          }
        }
    
        var method = super_prototype[ name ];
        calling_chain.push( method );
        method.chain = calling_chain;
        var result = method.apply( self.context, arguments );
        delete method.chain;
      
        return result;
      };
};