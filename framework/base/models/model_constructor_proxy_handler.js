var FunctionProxyHandler = require('../../lib/proxy_handlers/function_proxy_handler');

module.exports = ModelConstructorProxyHandler.inherits( FunctionProxyHandler );

function ModelConstructorProxyHandler( params ) {
  this._init( params );
}


ModelConstructorProxyHandler.prototype._init = function( params ) {
  this._instance      = params.instance;
  params.on_construct = params.target = this._get_instance.bind( this );

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

  return typeof this._instance[ name ] == 'function'
    ? this._instance[ name ].bind( this._instance )
    : this._instance[ name ];
};


ModelConstructorProxyHandler.prototype.set = function ( receiver, name, value ) {
  return this._instance[ name ] = value;
};


ModelConstructorProxyHandler.prototype._get_instance = function ( params ) {
  params     = params || {};
  params.app = this._instance.app;

  return new this._instance.constructor( params );
};