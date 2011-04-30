var ProxyHandler        = require('./proxy_handler');
var ModelProxyHandler   = require('./model_proxy_handler');
var AppModule           = require('app_module');

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
    target       : function() {
      return self._get_instance( constructor, params );
    },
    on_construct : create_model
  });

  return model_handler.get_proxy();
};


ModelsProxyHandler.prototype.create_model = function ( constructor, params ) {
  var model_instance = this._get_instance( constructor, params );

  var handler = new ModelProxyHandler({
    target    : model_instance,
    instance  : model_instance
  });

  return handler.get_object_proxy();
};


ModelsProxyHandler.prototype._get_instance = function ( constructor, params ) {
  params     = params || {};
  params.app = this.app;

  return new constructor( params );
};