var ProxyHandler = require('./proxy_handler');

module.exports = InheritingProxyHandler;

function InheritingProxyHandler( params ) {
  this._init( params );
}

require('util').inherits( InheritingProxyHandler, ProxyHandler );


InheritingProxyHandler.prototype._init = function ( params ) {
  ProxyHandler.prototype._init.call( this, params );

  this.context         = params.context;
  this.stack           = {};

  this.super_prototype = this.target;
  this.calling         = false;
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

// падает при рекурсии
//InheritingProxyHandler.prototype.get = function ( receiver, name ) {
//  if ( typeof this.target[name] != 'function' ) return this.target[name];
//
//  var root = false;
//  if ( !this.stack[ name ] ){
//    this.stack[ name ] = this.target;
//    root               = true;
//  }
//
//  var super_prototype = this.get_prototype_with_method( this.stack[ name ], name );
//  if ( root ) super_prototype = this.get_prototype_with_method( Object.getPrototypeOf( super_prototype ), name );
//
//  var context = this.context;
//  var self    = this;
//  this.stack[ name ] = Object.getPrototypeOf( super_prototype );
//
//  return function(){
//    try{
//      var result = super_prototype[ name ].apply( context, arguments );
//    }
//    catch(e){
//      if ( root ) delete self.stack[ name ];
//      throw e;
//    }
//    finally{
//      if ( root ) delete self.stack[ name ];
//    }
//
//    return result;
//  }
//};
//
//
//InheritingProxyHandler.prototype.get_prototype_with_method = function ( prototype, method ) {
//  while ( !prototype.hasOwnProperty( method ) ) {
//    prototype = Object.getPrototypeOf( prototype );
//    if ( prototype === null )
//      throw new TypeError( method + ' is not a function' );
//  }
//
//  return prototype;
//};