var FunctionProxyHandler = require('./function_proxy_handler');

module.exports = ModelProxyHandler.inherits( FunctionProxyHandler );

function ModelProxyHandler( params ) {
  this._init( params );
}


ModelProxyHandler.prototype._init = function( params ) {
  this.super_._init( params );

  this._instance = null;
};


ModelProxyHandler.prototype.get = function ( receiver, name ) {
  if ( name == 'prototype' || name in Function.prototype ) return this.target[ name ];

  if ( !this._instance ) this._instance = this.target();
  return this._instance[ name ];
};


ModelProxyHandler.prototype.set = function ( receiver, name, value ) {
  if ( !this._instance ) this._instance = this.target();
  return this._instance[ name ] = value;
};


//ModelProxyHandler.prototype.get_proxy = function ( receiver, name ) {
//
//};