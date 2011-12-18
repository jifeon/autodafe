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
  var args  = this.slice.call( arguments, 2 );
  args.unshift( null );

  for (var i = 0; i < len; i++)
  {
    if ( i in t ){
      args[0] = t[i];
      if ( fun.apply( thisp || t[i], args ) === false ) break;
    }
  }
};


Object.merge = function( obj1, obj2 ) {
  obj1 = obj1 || {};
  obj2 = obj2 || {};

  if ( !Object.isObject( obj1 ) || !Object.isObject( obj2 ) ) throw new TypeError;

  var res = Object.not_deep_clone( obj1 );

  for ( var prop in obj2 ) {
    res[ prop ] = obj2[ prop ];
  }

  return res;
};


Object.values = function( obj ) {
  return Object.keys( obj ).map( function( v ) {
    return obj[v];
  } );
}


Object.recursive_merge = function( obj1, obj2 ) {
  obj1 = obj1 || {};
  obj2 = obj2 || {};

  if ( !Object.isObject( obj1 ) || !Object.isObject( obj2 ) ) throw new TypeError;

  var res = Object.clone( obj1 );

  for ( var prop in obj2 ) {
    if ( res[ prop ] && res[ prop ] instanceof Object && obj2[ prop ] && obj2[ prop ] instanceof Object )
      res[ prop ] = this.recursive_merge( res[ prop ], obj2[ prop ] );
    else res[ prop ] = obj2[ prop ];
  }

  return res;
};


Object.isEmpty = function( v ) {
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
  return v && v instanceof this && !Array.isArray( v ) && typeof v != 'function';
}


Object.not_deep_clone = function( obj ) {

  if ( Array.isArray( obj ) ) return obj.slice( 0 );

  if ( !Object.isObject( obj ) ) return obj;

  var result = {};
  for ( var prop in obj )
    result[ prop ] = obj[ prop ];


  return result;
}


Object.reset = function( obj ) {
  if ( this.isEmpty( obj ) ) return null;
  if ( Array.isArray( obj ) ) return obj[0];
  if ( this.isObject( obj ) ) return obj[ this.keys( obj )[0] ];
  return null;
}

// todo: вернуть после написания тестов
//var InheritingProxyHandler = require( './proxy_handlers/inheriting_proxy_handler' );

Function.prototype.inherits = function( super_class ) {
  require('util').inherits( this, super_class );

  this.parent = super_class.prototype;

//  this.prototype.__defineGetter__( 'super_', function() {
//    if ( this.__super__ ) return this.__super__;

//    var handler = new InheritingProxyHandler( {
//      target  : Object.getPrototypeOf( this ),
//      context : this
//    } );
//
//    this.__super__ = handler.get_proxy();
//    return this.__super__;
//  } );

  return this;
}


Function.prototype.is_instantiate = function ( obj ) {
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


String.unique = function(){
  var idx = [], itoh = '0123456789ABCDEF'.split('');

  // Array of digits in UUID (32 digits + 4 dashes)
  for (var i = 0; i < 36; i++) { idx[i] = 0xf & Math.random() * 0x10; }
  // Conform to RFC 4122, section 4.4
  idx[14] = 4; // version
  idx[19] = (idx[19] & 0x3) | 0x8; // high bits of clock sequence

  // Convert to hex chars
  for (var i = 0; i < 36; i++) { idx[i] = itoh[idx[i]]; }

  // Insert dashes
  idx[8] = idx[13] = idx[18] = idx[23] = '-';

  return idx.join('');
}


Number.frequency_to_period = function( frequency ) {
  var result = {
    count   : 1,
    period  : 0
  }

  if ( typeof frequency != 'string' ) return result;

  var ar = frequency.split( 'per' );
  if ( ar.length != 2 ) return result;

  var count   = parseInt( ar[0], 10 );
  var period  = parseInt( ar[1], 10 );

  if ( isNaN( count ) || isNaN( period ) ) return result;

  var factors = {
    'sec' : 1000,
    'min' : 60000,
    'hou' : 360000,
    'day' : 8.64e6,
    'wee' : 5.901e7,
    'mon' : 2.529e8
  };

  var factor = ar[1].match( /\W(\w{3})/ );
  factor = factors[ factor && factor[1] ];

  if ( isNaN( factor ) ) factor = 1;

  result.count  = count;
  result.period = period * factor;

  return result;
}


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


Date.prototype.getUTCFormat = function( format ) {
  var self = this;
  return format.replace( /[\w]/g, function( match ) {
    switch ( match ) {
      case 'Y': return self.getUTCFullYear();
      case 'M': return two_pos( self.getUTCMonth() + 1 );
      case 'D': return two_pos( self.getUTCDate() );
      case 'h': return two_pos( self.getUTCHours() );
      case 'm': return two_pos( self.getUTCMinutes() );
      case 's': return two_pos( self.getUTCSeconds() );
      case 'x':
        var x = self.getUTCMilliseconds();
        return x < 100 ? '0' + two_pos( x ) : x;
    }
  } );
}


process.EventEmitter.prototype.re_emit = function() {
  var emitter = arguments[ arguments.length - 1 ];
  for ( var i = 0, i_ln = arguments.length - 1; i < i_ln; i++ ) {
    var action = arguments[i];
    this.on( action, emitter.emit.bind( emitter, action ) );
  }

  return this;
}

var dust = exports.dust = require('dust.js');
dust.filters.n = function( value ){
  return isFinite( value ) ? Number( value ) : 0;
}

dust.filters.b = function( value ){
  return value ? 'true' : 'false';
}


function two_pos( i ) {
  return i < 10 ? '0' + i : i;
}


exports.next_tick = function( result, error, emitter, action ){
  emitter = emitter || new process.EventEmitter;

  process.nextTick( function() {
    emitter.emit( action || ( error ? 'error' : 'success' ), error || result );
  } );

  return emitter;
};

var Listener = require('./listener');
exports.create_async_listener = function( count, callback, params, do_not_fire ) {
  return new Listener( count, callback, params, do_not_fire );
};


exports.get_parallel_listener = function ( count, callback, context, params ) {
  var fired = 0;
  var self  = this;

  if ( !count ) return process.nextTick( function() {
    callback.call( context || null, params );
  } );

  return function() {
    var argument_names = Array.prototype.slice.call( arguments, 0 );
    var has_errors     = false;

    return function() {
      if ( has_errors ) return false;

      var can_receive_error = argument_names[0] == 'error';

      if ( can_receive_error && arguments[0] instanceof Error ) {
        has_errors = true;
        return callback.call( context || null, arguments[0] );
      }

      for ( var i = 0, i_ln = argument_names.length; i < i_ln; i++ ) {
        params = params || {};
        params[ argument_names[i] ] = arguments[i];
      }

      if ( ++fired == count ) callback.call(
        context || null,
        can_receive_error ? null : params,
        can_receive_error ? params : undefined
      );
    }
  }
};