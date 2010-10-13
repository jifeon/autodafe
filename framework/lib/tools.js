Array.prototype.diff = function( ar ) {
  if ( !( ar instanceof Array ) ) return this;
  var res = [];

  for ( var i = 0, i_ln = this.length; i < i_ln; i++ ) {
    if ( ar.indexOf( this[i] ) == -1 ) res.push( this[i] );
  }

  return res;
};


Object.merge = function( obj1, obj2 ) {
  if ( !( obj1 instanceof Object ) || !( obj2 instanceof Object ) ) return obj1;

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
  if ( !( obj1 instanceof Object ) || !( obj2 instanceof Object ) ) return obj1;

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
  if ( v instanceof Object ) {
    var empty = true;

    for ( var prop in v ) {
      empty = false;
      break;
    }

    if ( empty ) return true;
  }

  return false;
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


Array.prototype.merge = function( ar ) {
  if ( !( ar instanceof Array ) ) return this;
  var res = this.slice( 0 );
  
  for ( var i = 0, i_ln = ar.length; i < i_ln; i++ ) {
    if ( res.indexOf( ar[i] ) == -1 ) res.push( ar[i] );
  }

  return res;
};