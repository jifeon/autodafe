Array.prototype.diff = function( ar ) {
  if ( !Array.isArray( ar ) ) return new TypeError;

  return this.filter( function( el ) {
    return ar.indexOf( el ) == -1;
  } );
};


Array.prototype.merge = function( ar ) {
  return this.push.apply( this.slice( 0 ), this.diff( ar ) );
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