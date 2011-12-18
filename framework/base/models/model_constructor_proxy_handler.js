var FunctionProxyHandler = require('../../lib/proxy_handlers/function_proxy_handler');
var ProxyHandler         = require('../../lib/proxy_handlers/proxy_handler');
var ModelProxyHandler    = require('./model_proxy_handler.js');

module.exports = ModelConstructorProxyHandler.inherits( FunctionProxyHandler );

function ModelConstructorProxyHandler( params ) {
  this._init( params );
}


ModelConstructorProxyHandler.prototype._init = function( params ) {
  var self = this;

  this._instance      = params.instance;
  params.on_construct = params.target = function( construct_params ){
    return self._get_instance( construct_params );
  }

  ModelConstructorProxyHandler.parent._init.call( this, params );
};


ModelConstructorProxyHandler.prototype.get = function ( receiver, name ) {
  if (
    name == 'prototype'
    ||
    name in Function.prototype &&
    typeof  Function.prototype[ name ] == 'function' &&
    name != 'constructor'
  )
    return this._instance.constructor[ name ];

  if ( name == 'constructor' ) return this._instance.constructor;

  return name == '__origin__' ? this._instance : this._instance.get_attribute( name );
};


ModelConstructorProxyHandler.prototype.set = function ( receiver, name, value ) {
  return this._instance.set_attribute( name, value );
};


ModelConstructorProxyHandler.prototype._get_instance = function ( params ) {
  params     = params || {};
  params.app = this._instance.app;

  var instance = new this._instance.constructor( params );
  var handler  = new ModelProxyHandler({
    target : instance
  });

  return handler.get_proxy();
};