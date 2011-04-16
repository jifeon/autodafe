var Proxy         = require( '../node-proxy/lib/node-proxy' );
var ProxyHandler  = require('./proxy_handler');

module.exports = FunctionProxyHandler.inherits( ProxyHandler );

function FunctionProxyHandler( params ) {
  this._init( params );
}


FunctionProxyHandler.prototype._init = function ( params ) {
  this.super_._init( {
    target : params.on_call
  } );

  this.on_construct = params.on_construct || params.on_call;
};


FunctionProxyHandler.prototype.get_proxy = function () {
  return Proxy.createFunction( this, this.target, this.on_construct );
};