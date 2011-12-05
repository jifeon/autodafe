var ProxyHandler        = require('../../lib/proxy_handlers/proxy_handler');
var AppModule           = global.autodafe.AppModule;
var path                = require('path');

module.exports = ModelsProxyHandler.inherits( ProxyHandler );

function ModelsProxyHandler( params ) {
  this._init( params );
}


ModelsProxyHandler.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params || !params.app )
    throw new Error( 'Link to application is not defined in ModelsProxyHandler.init' );

  this.app = params.app;
};


ModelsProxyHandler.prototype.get = function ( receiver, name ) {
  return this.target.get_model( name ) || this.super_.get( receiver, name );
};


