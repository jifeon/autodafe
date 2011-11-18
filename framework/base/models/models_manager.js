var AppModule           = require('app_module');
var Model               = require('model');
var ModelProxyHandler   = require('./model_proxy_handler');
var path                = require('path');
var fs                  = require('fs');

module.exports = ModelsManager.inherits( AppModule );

function ModelsManager( params ) {
  this._init( params );
}


ModelsManager.prototype._init = function( params ){
  this.super_._init( params );
  
  this._models = {};
};


ModelsManager.prototype.get_model = function( model_name ){
  return this._models[ model_name ] || null;
};


ModelsManager.prototype.load_models = function ( callback ) {
  var models_path = this.app.path_to_models;
  this.log( 'Loading models from path: ' + models_path, 'trace' );

  var listener = this.app.tools.create_async_listener(
    0, this._loading_complete.bind( this, callback ), null, true
  );

  try {
    var files = fs.readdirSync( models_path );
  }
  catch ( e ) {
    this.log( 'Cannot find models folder. Skip loading models.', 'trace' );
    listener.fire();
    return false;
  }

  var self          = this;

  for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {

    try {
      var file        = files[f];
      var file_path   = path.join( models_path, file );
      var stat        = fs.statSync( file_path );

      if ( !stat.isFile() ) continue;

      var model_constructor = require( file_path );
    }
    catch( e ) {
      this.log( 'Can\'t load model from file: %s'.format( file_path ), 'warning' );
      this.log( e, 'warning' );
      continue;
    }

    if ( !Model.is_instantiate( model_constructor.prototype ) ) {
      this.log( 'File in path `%s` is not a valid model'.format( file_path ), 'warning' );
      continue;
    }

    var name  = path.basename( file_path, '.js' );
    try {
      var model = this._get_by_constructor( model_constructor );
    } catch (e) {
      this.log( 'Model "%s" is not loaded'.format( name ), 'error' );
      this.log( e );
      continue;
    }

    if ( !model.is_inited ) {
      listener.count++;
      model.on( 'initialized', listener.listen() );
    }

    this._models[ name ] = model;
    this.log( 'Model "%s" is loaded'.format( name ), 'trace' );
  }

  listener.check_count.bind( listener );
};


ModelsManager.prototype._loading_complete = function ( callback ) {
  this.log( 'Models are loaded', 'info' );
  process.nextTick( callback );
};


ModelsManager.prototype._get_by_constructor = function ( constructor, params ) {
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
  return !!this.get_model( model_name );
};


ModelsManager.prototype.for_each_model = function ( callback, context ) {
  for( var name in this._models ) {
    callback.call( context || null, this._models[ name ], name );
  }
};