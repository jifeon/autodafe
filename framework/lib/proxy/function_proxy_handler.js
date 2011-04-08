var Proxy         = require( './node-proxy/lib/node-proxy' );
var ProxyHandler  = require('./proxy_handler');

module.exports = FunctionProxyHandler;

function FunctionProxyHandler( params ) {
  this._init( params );
}

require('util').inherits( FunctionProxyHandler, ProxyHandler );


FunctionProxyHandler.prototype._init = function ( params ) {
  ProxyHandler.prototype._init.call( this, {
    target : params.on_call
  } );

  this.on_construct = params.on_construct;
};


FunctionProxyHandler.prototype.get_proxy = function () {
  return Proxy.createFunction( this, this.target, this.on_construct );
};