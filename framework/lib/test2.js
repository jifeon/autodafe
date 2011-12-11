require('./tools.js');
var ap = require( '../base/autodafe_part.js' );
var ph = require('./proxy_handlers/proxy_handler.js');

var a = new ap;
a._.b = 3;
a.m = function(){
  this._.g = 4;
}
console.log( a.b );

var h = new ph({target : a});
h.get = function( r, name ){
  console.log( name );
  if ( name == 'super_' ) return super_prototype.super_;
  return this.__proto__.get.call( this, r, name );
}
var p = h.get_proxy();
//console.log( p._.b );

p._.b = 7;
console.log( a.b );

a.m.call( p );
console.log( a.g );