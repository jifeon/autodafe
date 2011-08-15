var AppModule = require('app_module');

module.exports = ModelsManager.inherits( AppModule );

function ModelsManager( params ) {
  this._init( params );
}


ModelsManager.prototype._init = function( params ){
  this.super_._init( params );
  
  this._models = {};
};


ModelsManager.prototype.get_model = function( model_name ){
  if ( this._models[ model_name ] ) return this._models[ model_name ];

  this._load_model( model_name );

  return this._models[ model_name ];
};


ModelsManager.prototype._load_model = function( model_name ){
  var model;
  try {
    model = require( path.resolve( this.app.base_dir, this.app.models_folder, model_name ) );
  }
  catch( e ) {
    this.app.log(e);
    throw new Error( 'Can\'t load model `%s`'.format( model_name ) );
  }

  this._models[ model_name ] = this.get_by_constructor( model );
};



ModelsManager.prototype.get_by_constructor = function ( constructor, params ) {
  var self = this;

  var create_model = function( construct_params ) {
    return self.implement_model( constructor, construct_params );
  };

  var model_handler = new ModelProxyHandler({
    target       : function() {
      return self._get_instance( constructor, params );
    },
    on_construct : create_model
  });

  return model_handler.get_proxy();
};


ModelsManager.prototype.implement_model = function ( constructor, params ) {
  var model_instance = this._get_instance( constructor, params );

  var handler = new ModelProxyHandler({
    target    : model_instance,
    instance  : model_instance
  });

  return handler.get_object_proxy();
};


ModelsManager.prototype._get_instance = function ( constructor, params ) {
  params     = params || {};
  params.app = this.app;

  return new constructor( params );
};


ModelsManager.prototype.is_model_exist = function( model_name ){
  try {
    var model = this.get_model( model_name );
  }
  catch( e ) {
    return false;
  }

  return !!model;
};