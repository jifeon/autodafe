Array.prototype.diff = function( ar ) {
  if ( !Array.isArray( ar ) ) return new TypeError;

  return this.filter( function( el ) {
    return ar.indexOf( el ) == -1;
  } );
};


Array.prototype.merge = function( ar ) {
  return this.push.apply( this.slice( 0 ), this.diff( ar ) );
};


Array.prototype.for_each = function ( fun/*, thisp*/ ) {
  "use strict";

  if (this === void 0 || this === null)
    throw new TypeError();

  var t   = Object(this);
  var len = t.length >>> 0;
  if (typeof fun !== "function") throw new TypeError();

  var thisp = arguments[1];
  var args  = this.prototype.slice.call( arguments, 2 );
  args.unshift( null );

  for (var i = 0; i < len; i++)
  {
    if ( i in t ){
      args[0] = t[i];
      fun.apply( thisp, args );
    }
  }
};


Object.merge = function( obj1, obj2 ) {
  if ( !( obj1 instanceof Object ) || !( obj2 instanceof Object ) ) return new TypeError;

  var res = {}, prop;

  for ( prop in obj2 ) {
    res[ prop ] = obj2[ prop ];
  }

  for ( prop in obj1 ) {
    res[ prop ] = obj1[ prop ];
  }

  return res;
};


Object.recursive_merge = function( obj1, obj2 ) {
  if ( !( obj1 instanceof Object ) || !( obj2 instanceof Object ) ) return new TypeError;

  var res = {}, prop;

  for ( prop in obj2 ) {
    res[ prop ] = obj2[ prop ];
  }

  for ( prop in obj1 ) {
    if ( res[ prop ] instanceof Object ) res[ prop ] = this.recursive_merge( obj1[ prop ], res[ prop ] );
    else res[ prop ] = obj1[ prop ];
  }

  return res;
};


Object.empty = function( v ) {
  if ( !v ) return true;
  if ( v instanceof Array && !v.length ) return true;
  return v instanceof this && !this.keys( v ).length;
};


Object.clone = function( obj ) {
  var result;

  if ( obj instanceof Array ) {
    result = [];
    for ( var c = 0, c_ln = obj.length; c < c_ln; c++ ) {
      result.push( this.clone( obj[c] ) );
    }
  }
  else if ( obj instanceof Object ) {
    result = {};
    for ( var prop in obj ) {
      result[ prop ] = this.clone( obj[ prop ] );
    }
  }
  else result = obj;

  return result;
};

var Proxy             = require( './proxy/node-proxy/lib/node-proxy' );
var ForwardingHandler = require( './proxy/proxy_handler' );

Function.prototype.inherits = function( super_class ) {
  require('util').inherits( this, super_class );

  Object.defineProperty( this.prototype, 'super_', {
    get : function() {

      var super_prototype = super_class.prototype;
      var handler         = ForwardingHandler( super_prototype );

      var self    = this;
      handler.get = function( receiver, name ) {
        return typeof super_prototype[name] == 'function' ? function() {

          var super_prototype_with_own_method = super_prototype;

          while (
            !super_prototype_with_own_method.hasOwnProperty( name ) ||
            arguments.callee.caller == super_prototype_with_own_method[ name ]
          ) {
            try {
              super_prototype_with_own_method = super_prototype_with_own_method.constructor.super_.prototype;
            }
            catch (e) {
              throw new TypeError( name + ' is not a function' );
            }
          }

          super_prototype_with_own_method[ name ].apply( self, arguments );
        } : super_prototype[name];
      }

      return this.constructor.proxy = Proxy.create( handler );
    }
  } );

  return this;
}


String.prototype.format = function() {
  var i = 0;
  var args = arguments;
  return this.replace( /%s|%d/g, function() {
    return args[ i++ ];
  } );
};


Date.prototype.format = function( format ) {
  var self = this;
  return format.replace( /[\w]/g, function( match ) {
    switch ( match ) {
      case 'Y': return self.getFullYear();
      case 'M': return two_pos( self.getMonth() + 1 );
      case 'D': return two_pos( self.getDate() );
      case 'h': return two_pos( self.getHours() );
      case 'm': return two_pos( self.getMinutes() );
      case 's': return two_pos( self.getSeconds() );
      case 'x':
        var x = self.getMilliseconds();
        return x < 100 ? '0' + two_pos( x ) : x;
    }
  } );
}

function two_pos( i ) {
  return i < 10 ? '0' + i : i;
}