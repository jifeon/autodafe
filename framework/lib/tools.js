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


//todo: delete
Object.values = function( obj ) {
  return Object.keys( obj ).map( function( v ) {
    return obj[v];
  } );
}


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


//todo: delete
Object.reset = function( obj ) {
  if ( this.isEmpty( obj ) ) return null;
  if ( Array.isArray( obj ) ) return obj[0];
  if ( this.isObject( obj ) ) return obj[ this.keys( obj )[0] ];
  return null;
}

Function.prototype.inherits = function( super_class ) {
  require('util').inherits( this, super_class );

  this.parent = super_class.prototype;

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

var assert = require( 'assert' );
assert.isReadOnly = function ( actual, actual_property, message ) {
  var writable  = true;

  try {
    actual[ actual_property ] = null;
  }
  catch( e ) {
    writable = false;
  }

  var removable = delete actual[ actual_property ];

  if ( writable || removable ) {
      assert.fail( actual_property, 0, message || "expected {actual} to be read only", "isReadOnly", assert.isReadOnly );
  }
};


assert.isError = function ( actual, message ) {
  assert.instanceOf( actual, Error, message );
};


process.EventEmitter.prototype.re_emit = function() {
  var emitter = arguments[ arguments.length - 1 ];
  for ( var i = 0, i_ln = arguments.length - 1; i < i_ln; i++ ) {
    var action = arguments[i];
    this.on( action, emitter.emit.bind( emitter, action ) );
  }

  return this;
}

var dust = exports.dust = require('dustjs-linkedin');
dust.filters.n = function( value ){
  return isFinite( value ) ? Number( value ) : 0;
}

dust.filters.b = function( value ){
  return value ? 'true' : 'false';
}

// disable whitespace compression
dust.optimizers.format = function( ctx, node ) {
  return node
};


exports.get_dust_chunk_body_content = function( chunk, context, body ){
  var result = '';

  var old_write = chunk.write;
  chunk.write = function( text ) {
    result += text;
    return chunk;
  }
  body( chunk, context );
  chunk.write = old_write;

  return result;
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
exports.create_async_listener = function( count, callback, params, options ) {
  return new Listener( count, callback, params, options );
};


exports.to_object = function( obj, deep, current_deep ){
  var result  = {};
  current_deep = current_deep || 0;
  if ( deep <= current_deep ) return obj;

  if ( typeof obj == 'string' ) obj = [obj];

  if ( Object.isObject( obj ) )
    for ( var key in obj ) {
      var transformed = this.to_object( obj[ key ], deep, current_deep+1 );
      key.split(/\s+/).forEach(function( item ){
        result[ item ] = transformed;
      });
    }

  else if ( Array.isArray( obj ) ) obj.forEach(function( item ){
    if ( Object.isObject( item ) || Array.isArray( item ) )
      result = Object.merge( result, exports.to_object( item, deep, current_deep+1 ) );
    else if ( typeof item == 'string' ) item.split(/\s+/).forEach(function( item ){
      result[ item ] = true;
    });
  });

  else result = obj;

  return result;
}