Array.prototype.diff = function( ar ) {
  "use strict";

  if ( !Array.isArray( ar ) ) throw new TypeError;

  return this.filter( function( el ) {
    return ar.indexOf( el ) == -1;
  } );
};


Array.prototype.merge = function( ar ) {
  "use strict";

  if ( !Array.isArray( ar ) ) throw new TypeError;

  var new_ar = this.slice( 0 );
  this.push.apply( new_ar, ar.diff( this ) );
  return new_ar.unique();
};


Array.prototype.unique = function () {
  "use strict";

  return this.filter( function( el, i ) {
    return this.indexOf( el ) == i;
  }, this );
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
  if ( !Object.isObject( obj1 ) || !Object.isObject( obj2 ) ) throw new TypeError;

  var res = Object.not_deep_clone( obj1 );

  for ( var prop in obj2 ) {
    res[ prop ] = obj2[ prop ];
  }

  return res;
};


Object.recursive_merge = function( obj1, obj2 ) {
  if ( !Object.isObject( obj1 ) || !Object.isObject( obj2 ) ) throw new TypeError;

  var res = Object.clone( obj1 );

  for ( var prop in obj2 ) {
    if ( res[ prop ] && res[ prop ] instanceof Object && obj2[ prop ] && obj2[ prop ] instanceof Object )
      res[ prop ] = this.recursive_merge( res[ prop ], obj2[ prop ] );
    else res[ prop ] = obj2[ prop ];
  }

  return res;
};


Object.empty = function( v ) {
  if ( !v ) return true;
  if ( v instanceof Array && !v.length ) return true;
  return v instanceof this && !this.keys( v ).length;
};


Object.clone = function( obj ) {

  if ( Array.isArray( obj ) ) return obj.map( function( item ) {
    return Object.clone( item );
  } );

  if ( !Object.isObject( obj ) ) return obj;

  var result = {};
  for ( var prop in obj ) {
    result[ prop ] = this.clone( obj[ prop ] );
  }

  return result;
};


Object.isObject = function( v ) {
  return v && v instanceof this && !Array.isArray( v );
}


Object.not_deep_clone = function( obj ) {

  if ( Array.isArray( obj ) ) return obj.slice( 0 );

  if ( !Object.isObject( obj ) ) return obj;

  var result = {};
  for ( var prop in obj )
    result[ prop ] = obj[ prop ];

  return result;
}


var InheritingProxyHandler = require( './proxy/inheriting_proxy_handler' );

Function.prototype.inherits = function( super_class ) {
  require('util').inherits( this, super_class );

  Object.defineProperty( this.prototype, 'super_', {
    get : function() {

      var handler = new InheritingProxyHandler( {
        target  : super_class.prototype,
        context : this
      } );

      return handler.get_proxy();
    }
  } );

  return this;
}


Function.prototype.instantiate = function ( obj ) {
  return obj instanceof this;
};


String.prototype.format = function() {
  var obj = arguments[0];
  if ( Object.isObject( obj ) ) {
    var res = this;
    for ( var str in obj ) res = res.replace( str, obj[ str ] );
    return res;
  }

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