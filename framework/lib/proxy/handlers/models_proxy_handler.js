var FunctionProxyHandler  = require('./function_proxy_handler');
var ModelProxyHandler     = require('./model_proxy_handler');
var AppModule             = require('app_module');

module.exports = ModelsProxyHandler.inherits( FunctionProxyHandler );

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
    model = require( name );
  }
  catch( e ) {
    throw new Error( 'Can\'t find model `%s`'.format( name ) );
  }

  this.target[ name ] = this.get_by_class( model );
  return this.target[ name ];
};


ModelsProxyHandler.prototype.get_by_class = function ( constructor, params ) {
  var self = this;

  var create_model = function() {
    return self.create_model( constructor, params );
  }

  var model_handler = new ModelProxyHandler({
    on_call : create_model
  });

  return model_handler.get_proxy();
};


ModelsProxyHandler.prototype.create_model = function ( constructor, params ) {
  params     = params || {};
  params.app = this.app;

  var model_instance = new constructor( params );

  var handler = new ModelProxyHandler({
    target    : model_instance,
    instance  : model_instance
  });

  return handler.get_object_proxy();
};