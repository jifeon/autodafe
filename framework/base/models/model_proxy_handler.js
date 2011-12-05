var FunctionProxyHandler = require('../../lib/proxy_handlers/function_proxy_handler');
var ProxyHandler         = require('../../lib/proxy_handlers/proxy_handler');

module.exports = ModelProxyHandler.inherits( FunctionProxyHandler );

function ModelProxyHandler( params ) {
  this._init( params );
}


ModelProxyHandler.prototype._init = function( params ) {
  this.super_._init( params );

  this._instance    = params.instance || this.target();
};


ModelProxyHandler.prototype.get = function ( receiver, name ) {
  if ( name == 'prototype' || name in Function.prototype && typeof Function.prototype[name] == 'function' && name != 'constructor' )
    return this.target[ name ];

  if ( name == 'constructor' ) return this._instance.constructor;
  
  return name == '__origin__' ? this._instance : this._instance.get_attribute( name );
};


ModelProxyHandler.prototype.set = function ( receiver, name, value ) {
  if ( !this._instance ) this._instance = this.target();
  return this._instance.set_attribute( name, value );
};


ModelProxyHandler.prototype.get_object_proxy = function () {
  return ProxyHandler.prototype.get_proxy.call( this );
};