var path                  = require('path');
var fs                    = require('fs');
var dust                  = require('dust.js');
var Session               = require('./session');
var Router                = require('./routing/router');
var Logger                = require('../logging/logger');
var ComponentsManager     = require('../components/components_manager');
var ModelsManager         = require('./models/models_manager');
var ProxyHandler          = require('../lib/proxy_handlers/proxy_handler.js');

module.exports = Application.inherits( autodafe.AutodafePart );

function Application( config ) {
  this._init( config );
}


Application.prototype.tools = require('../lib/tools');


Application.prototype._init = function ( config ) {
  this.setMaxListeners( 1000 );

  Application.parent._init.call( this );

  this._config        = config            || {};
  this._sessions      = {};
  this._views_mtime   = {};
  this._run_on_init   = false;

  this.views_loaded   = false;

  if ( typeof this._config.name != 'string' )
    throw new Error( 'Please specify application name in your config file' );
  this._.name         = this._config.name;

  if ( !this._config.base_dir )
    throw new Error( 'Please specify `base_dir` in your config file!' );
  this._.base_dir     = path.normalize( this._config.base_dir );

  this._.is_running   = false;

  this.logger         = new Logger;
  this.router         = null;
  this.components     = null;
  this.models         = null;

  this.default_controller     = this._config.default_controller || 'action';
  this._.path_to_models       = path.join( this.base_dir, this._config.models_folder      || 'models'      );
  this._.path_to_controllers  = path.join( this.base_dir, this._config.controllers_folder || 'controllers' );
  this._.path_to_components   = path.join( this.base_dir, this._config.components_folder  || 'components'  );
  this._.path_to_views        = path.join( this.base_dir, this._config.views_folder       || 'views'       );

  this._preload_components();
  this._init_core();
  this.on( 'core_is_built', this._init_components );
  this.on( 'components_are_loaded', function() {
    this.run = this.__run;
    this.log( 'Application is ready to run', 'info' );
    this.emit( 'ready' );
  } );
};


Application.prototype._init_core = function () {
  if ( this._config.cache_views !== false ) this.load_views();

  this._init_models();
  this.on( 'models_are_loaded', this._init_router );
  this.on( 'router_is_ready', function() {
    this.emit( 'core_is_built' );
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

    var cached          = dust.cache[ view_path ];
    var full_file_name  = path.basename( view_path );

    if ( loaded_views[ full_file_name ] ) {
      conflict_names.push( full_file_name );
      dust.cache.__defineGetter__( full_file_name, function() {
        throw new Error( 'Ambiguous file name: `%s`. Use full path to render it'.format( full_file_name ) );
      } );
      dust.cache.__defineSetter__( full_file_name, function() {} );
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
      dust.cache.__defineSetter__( file_name, function() {} );
    }
    else {
      dust.cache[ file_name ]   = cached;
      loaded_views[ file_name ] = true;
    }
  }

  if ( !view_path ) {
    if ( conflict_names.length ) this.log(
      'You have few views with same name. Include them by full path. List of names of that views: `%s`'
        .format( conflict_names.join(', ') ), 'warning'
    );
    this.views_loaded = true;
    this.emit( 'views_are_loaded' );
    this.log( 'Views are loaded', 'info' );
  }
};


Application.prototype._init_models = function(){
  var models_manager = new ModelsManager({
    app : this
  });

  var models_handler = new ProxyHandler({
    target : models_manager
  });
  models_handler.get = function( receiver, name ){
    return models_manager.get_model( name ) || Object.getPrototypeOf( this ).get.call( this, receiver, name );
  }
  this._.models = models_handler.get_proxy();

  var self = this;
  models_manager.load_models( function( e ) {
    if ( e ) self.emit( 'error', e );
    else self.emit( 'models_are_loaded' );
  } );
};


Application.prototype._init_router = function () {
  var router_cfg  = this._config.router || {};
  router_cfg.app  = this;
  try {
    this.router     = new Router( router_cfg );
  }
  catch( e ){
    this.emit( 'error', e );
    return false;
  }

  this.log( 'Router is initialized', 'info' );
  this.emit( 'router_is_ready' );
};


Application.prototype._preload_components = function () {
  this.log( 'Preload components' );

  this.components = new ComponentsManager( {
    app        : this
  } );

  var components  = this._config.components         || {};
  var preload     = this._config.preload_components || [];

  preload.forEach( function( name ){
    var params = components[ name ];
    if ( params ) this.components.load( name, params );
  }, this );
};


Application.prototype._init_components = function () {
  this.log( 'Load components' );
  var components  = this._config.components         || {};

  for( var name in components ){
    var params = components[ name ];
    if ( params ) this.components.load( name, params );
  }

  this.log( 'Components are loaded', 'info' );
  this.emit( 'components_are_loaded' );
};


Application.prototype.register_component = function ( component ) {
  if ( !autodafe.Component.is_instantiate( component ) )
    throw new Error( 'Try to register `%s` as Component'.format( component && typeof component && component.class_name ) );

  var name = component.name;

  var property_descriptor = Object.getOwnPropertyDescriptor( this, name );
  if ( property_descriptor ) throw new Error(
    autodafe.Component.is_instantiate( property_descriptor.value || this._[name].value )
    ? 'Try to register two components with same name: %s'.format( name )
    : 'Try to register a component with name engaged for property of application: %s'.format( name )
  );

  this._[ name ] = component;
  this._[ name ].get = function( descriptor ) {
    return descriptor.value.get();
  };

  this._[ name ].set = function( v ) {
    throw new Error(
      'Property `%s` in Application engaged by component. \
       You can\'t redefine it to `%s`'.format( name, v )
    );
  }
};


Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] === undefined ? null : this._config.params[ name ];
};


Application.prototype.run = function ( callback ) {
  if ( this._run_on_init ) return false; // double run before init

  this._run_on_init = true;
  this.once( 'ready', function(){
    this.__run( callback );
  } );
  return true;
};


Application.prototype.__run = function ( callback ) {
  if ( this.is_running ) return false;

  callback = callback || autodafe.AppModule.prototype.default_callback;

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
      id        : id,
      app       : this,
      live_time : this._config.session_live_time
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


Application.prototype.stop = function () {
  this.log( 'Stop application' );
  this.emit( 'stop' );
};
