var ProxyHandler        = require('./proxy_handler');
var ModelProxyHandler   = require('./model_proxy_handler');
var AppModule           = require('app_module');
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
  if ( this.target[ name ] ) return this.target[ name ];

  var model;
  try {
    model = require( path.resolve( this.app.base_dir, this.app.models_folder, name ) );
  }
  catch( e ) {
    this.app.log(e);
    throw new Error( 'Can\'t find model `%s`'.format( name ) );
  }

  this.target[ name ] = this.get_by_constructor( model );
  
  return this.target[ name ];
};


