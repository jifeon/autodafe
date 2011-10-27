var tools                 = require('../lib/tools');
var path                  = require('path');
var fs                    = require('fs');
var dust                  = require('dust');
var Session               = require('session');
var Router                = require('routing/router');
var Logger                = require('../logging/logger');
var ComponentsManager     = require('components/components_manager');
var ModelsManager         = require('models/models_manager');
var Component             = require('components/component');
var ModelsProxyHandler    = require('./models/models_proxy_handler');
var AutodafePart          = require('autodafe_part');
var AppModule             = require('app_module');

module.exports = Application.inherits( AutodafePart );

function Application( config ) {
  this._init( config );
}


Application.instances = [];

Application.prototype._init = function ( config ) {
  this.setMaxListeners( 1000 );

  this.super_._init();

  Application.instances.push( this );
  this._config        = config            || {};
  this._sessions      = {};
  this._views_mtime   = {};
  this._run_on_init   = false;
  this.views_loaded   = false;

  if ( typeof this._config.name != 'string' )
    throw new Error( 'Please specify application name in your config file' );
  this._.name     = this._config.name;

  if ( !this._config.base_dir )
    throw new Error( 'Please specify `base_dir` in your config file!' );
  this._.base_dir = path.normalize( this._config.base_dir );

  this._.is_running       = false;

  this.tools              = tools;
  this.logger             = new Logger;
  this.router             = null;
  this.components         = null;
  this.models             = null;

  this.default_controller     = this._config.default_controller || 'action';
  this._.path_to_models       = path.join( this.base_dir, this._config.models_folder      || 'models'      );
  this._.path_to_controllers  = path.join( this.base_dir, this._config.controllers_folder || 'controllers' );
  this._.path_to_components   = path.join( this.base_dir, this._config.components_folder  || 'components'  );
  this._.path_to_views        = path.join( this.base_dir, this._config.views_folder       || 'views'       );

  this._preload_components();
  this._init_core( /*before*/ this._init_components );
};


Application.prototype._init_core = function ( callback ) {
  if ( this._config.cache_views !== false ) this.load_views();

  this._init_models( /*before*/ this._init_router );

  this.on( 'core_initialized', callback );

  this.on( 'initialized', function() {
    this.run = this.__run;
  } );
};


Application.prototype.load_views = function ( view_path, conflict_names, loaded_views ) {
  if ( !view_path && this.views_loaded && this._config.cache_views !== false ) return true;

  conflict_names     = conflict_names || [];
  loaded_views       = loaded_views   || {};

  var full_view_path = path.join( this.path_to_views, view_path );
  var stats          = fs.statSync( full_view_path );

  if ( stats.isDirectory() ) fs.readdirSync( full_view_path ).forEach( function( file ) {
    this.load_views( path.join( view_path, file ), conflict_names, loaded_views );
  }, this );

  else if ( stats.isFile() && this._views_mtime[ view_path ] != stats.mtime.getTime() ) {

    this.log( 'Load view `%s`'.format( view_path ), 'trace' );

    var template  = fs.readFileSync( full_view_path, 'utf8' );
    var compiled  = dust.compile( template, view_path );

    this._views_mtime[ view_path ] = stats.mtime.getTime();
    dust.loadSource( compiled );

    var cached         = dust.cache[ view_path ];
    var full_file_name = path.basename( view_path );

    if ( loaded_views[ full_file_name ] ) {
      conflict_names.push( full_file_name );
      dust.cache.__defineGetter__( full_file_name, function() {
        throw new Error( 'Ambiguous file name: `%s`. Use full path to render it'.format( full_file_name ) );
      } );
    }
    else {
      dust.cache[ full_file_name ]    = cached;
      loaded_views[ full_file_name ]  = true;
    }

    var file_name = path.basename( view_path, path.extname( view_path ) );

    if ( loaded_views[ file_name ] ) {
      dust.cache.__defineGetter__( file_name, function() {
        throw new Error( 'Ambiguous abbreviation name: `%s`. Use name with extension or full path to render it'.format( file_name ) );
      } );
    }
    else {
      dust.cache[ file_name ]   = cached;
      loaded_views[ file_name ] = true;
    }
  }

  if ( !view_path ) {
    if ( conflict_names.length ) this.log(
      'You have few views with same name. Include them by full path. List of names of thar views: `%s`'
        .format( conflict_names.join(', ') ), 'warning'
    );
    this.views_loaded = true;
    this.emit( 'views_loaded' );
  }
};


Application.prototype._init_models = function( callback ){
  var models_manager = new ModelsManager({
    app : this
  });

  var models_handler = new ModelsProxyHandler({
    target : models_manager,
    app    : this
  });

  this._.models = models_handler.get_proxy();

  var self = this;
  models_manager.load_models( function() {
    self.emit( 'models_loaded' );
    callback.call( self );
  } );
};


Application.prototype._init_router = function () {
  var router_cfg  = this._config.router || {};
  router_cfg.app  = this;
  this.router     = new Router( router_cfg );

  this.log( 'Router is initialized', 'info' );
  this.emit( 'core_initialized' );
};


Application.prototype._preload_components = function () {
  this.log( 'Preload components' );

  this.components = new ComponentsManager( {
    components : this._config.components,
    app        : this
  } );

  var preload = this._config.preload_components;
  if ( preload instanceof Array ) preload.forEach( function( component_name ){
    this.components.load_component( component_name );
  }, this );
};


Application.prototype._init_components = function () {
  this.log( 'Load components' );
  this.components.load_components();
  this.log( 'Components are loaded', 'info' );
  this.emit( 'initialized' );
};


Application.prototype.register_component = function ( component ) {
  var name;

  if ( typeof component == 'string' ) {
    name      = component;
    component = null;
    if ( this.is_property_engaged( name ) ) return false;
  }
  else name = component.name;

  if ( this.is_component_registered( name ) )  // !== undefined && !== null -> it's component
    throw new Error( 'Try to register two component with same name: %s'.format( name ) );

  if ( this.is_property_engaged( name ) )
    throw new Error(
      'Try to create component with name engaged for property of application: %s '.format( name )
    );

  this._[ name ] = component;
  this._[ name ].get = function() {
    if ( component ) return component.get();
    throw new Error(
      'Try to use component "%s" which is not included. \
       To include component configure it in your config file'.format( name )
    );
  };

  this._[ name ].set = function( v ) {
    throw new Error(
      'Property "%s" in Application engaged for native autodafe\'s component. \
       You can\'t set it to "%s"'.format( name, v )
    );
  }
};


Application.prototype.is_component_registered = function ( name ) {
  try {
    this[ name ];
  }
  catch( e ){ // component name engaged but null instead of component ( uses for system components )
    return false;
  }

  return this[ name ] instanceof Component;

//  return this._[ name ].value != null;  // !== undefined && !== null && in _ -> it's component
};


Application.prototype.is_property_engaged = function ( name ) {
  try {
    this[ name ];
  }
  catch( e ){ // component name engaged but null instead of component ( uses for system components )
    return false;
  }

  return typeof this[ name ] != 'undefined';
};


Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] === undefined ? null : this._config.params[ name ];
};


Application.prototype.run = function ( callback ) {
  if ( this._run_on_init ) return false; // double run before init

  this._run_on_init = true;
  this.once( 'initialized', function(){
    this.__run( callback );
  } );
  return true;
};


Application.prototype.__run = function ( callback ) {
  if ( this.is_running ) return false;

  callback = callback || AppModule.prototype.default_callback;

  this.log( 'Running application' );
  this.emit( 'run' );
  this._.is_running = true;

  callback( null, this );

  return true;
};


Application.prototype.log = function ( message, level, module ) {
  this.logger.log( message, level, module );
};


Application.prototype.get_session = function ( id, client ) {
  var session = this._sessions[ id ];

  if ( !session ) {
    session = new Session({
      id      : id,
      app     : this
    });

    this._sessions[ id ] = session;

    var self = this;
    session.once( 'close', function() {
      delete self._sessions[ id ];
    } );

    if ( client ) session.add_client( client );
    this.emit( 'new_session', session );
  }
  else if ( client ) session.add_client( client );

  return session;
};


Application.prototype.close = function () {
  this.emit( 'close' );
};