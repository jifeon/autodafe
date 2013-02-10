var AppModule           = global.autodafe.AppModule;
var Model               = global.autodafe.Model;
var ModelConstructorProxyHandler = require('./model_constructor_proxy_handler');
var path                = require('path');
var fs                  = require('fs');

module.exports = ModelsManager.inherits( AppModule );

function ModelsManager( params ) {
  this._init( params );
}


ModelsManager.prototype._init = function( params ){
  ModelsManager.parent._init.call( this, params );
  
  this._models = {};
};


ModelsManager.prototype.get_model = function( model_name ){
  return this._models[ model_name ] || null;
};


ModelsManager.prototype.load_models = function ( callback ) {
  var self        = this;
  var models_path = this.app.path_to_models;

  this.log( 'Loading models from path: ' + models_path, 'trace' );

  try {
    var files = fs.readdirSync( models_path );
  }
  catch ( e ) {
    this.log( 'Cannot find models folder. Skip loading models', 'warning' );
    return process.nextTick( callback );
  }

  var listener = new global.autodafe.lib.Listener;
  listener.success( function(){
    self.log( 'Models are loaded', 'info' );
    callback();
  });

  for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {

    try {
      var file        = files[f];
      var file_path   = path.join( models_path, file );
      var stat        = fs.statSync( file_path );

      if ( !stat.isFile() ) continue;

      var model_constructor = require( file_path );
    }
    catch( e ) {
      this.log( 'Can\'t load model from file: %s'.format( file_path ), 'error' );
      return callback( e );
    }

    if (model_constructor.prototype instanceof Model == false) {
      this.log( 'File in path `%s` is not a model'.format( file_path ), 'warning' );
      continue;
    }

    var name  = path.basename( file_path, '.js' );
    try {
      var model = this._get_model_proxy( model_constructor );
    } catch (e) {
      this.log( 'Model "%s" is not loaded'.format( name ), 'error' );
      return callback( e );
    }

    if ( !model.is_inited ) {
      model.on('ready', model.emit.bind( model, 'success'))
      listener.handle_emitter( model );
    }

    this._models[ name ] = model;
    this.log( 'Model "%s" is loaded'.format( name ), 'trace' );
  }

  if ( !listener.count ) {
    self.log( 'Models are loaded', 'info' );
    process.nextTick( callback );
  }
};


ModelsManager.prototype._get_model_proxy = function ( constructor, params ) {
  var model_handler = new ModelConstructorProxyHandler({
    instance : this._get_instance( constructor, params )
  });

  return model_handler.get_proxy();
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