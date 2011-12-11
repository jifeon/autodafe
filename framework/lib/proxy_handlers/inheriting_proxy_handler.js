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
          super_prototype = Object.getPrototypeOf( super_prototype );
          if ( super_prototype === null )
            throw new TypeError( name + ' is not a function' );
        }

        var method = super_prototype[ name ];
        calling_chain.push( method );
        method.chain = calling_chain;
        try {
          var result = method.apply( self.context, arguments );
        }
        catch( e ) {
          delete method.chain;
          throw e;
        }
        delete method.chain;

        return result;
      };
};


//InheritingProxyHandler.prototype.get = function ( receiver, name ) {
//  var self = this;
//
//  if ( typeof this.target[name] != 'function' ) return this.target[name];
//
//  var super_prototype = self.target;
//  while ( !super_prototype.hasOwnProperty( name ) ) {
//    super_prototype = Object.getPrototypeOf( super_prototype );
//    if ( super_prototype === null )
//      throw new TypeError( name + ' is not a function' );
//  }
//
//  var super_pointer_handler = new ProxyHandler({ target : self.context });
//  super_pointer_handler.get = function( r, name ){
//    if ( name == 'super_' ) return super_prototype.super_;
//    return this.__proto__.get.call( this, r, name );
//  }
//
//  return super_prototype[ name ].bind( super_pointer_handler.get_proxy() );
//};