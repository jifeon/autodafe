var path                  = require('path');
var Session               = require('session');
var Router                = require('router');
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
  this._config    = config            || {};
  this._sessions  = {};

  if ( typeof this._config.name != 'string' )
    throw new Error( 'Please specify application name in your config file' );
  this._.name     = this._config.name;

  if ( !this._config.base_dir )
    throw new Error( 'Please specify `base_dir` in your config file!' );
  this._.base_dir = path.normalize( this._config.base_dir );

  this._.is_running       = false;
  this._.is_initialized   = false;
  
  this.logger             = new Logger;
  this.router             = null;
  this.components         = null;
  this.models             = null;

  this.default_controller = this._config.default_controller || 'action';
  this.models_folder      = 'models';
  this.controllers_folder = 'controllers';
  this.components_folder  = 'components';

  this._preload_components();
  this._init_core( /*before*/ this._init_components );
};


Application.prototype._init_core = function ( callback ) {
  this._init_models( /*before*/ this._init_router );

  this.on( 'core_initialized', callback );

  this.on( 'initialized', function() {
    this.run = this.__run;
  } );
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

  this.log( 'Router has initialized', 'info' );
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
    if ( this[ name ] ) return false;
  }
  else name = component.name;

  if ( this[ name ] )
    throw new Error(
      (
        this[ name ] instanceof Component
        ? 'Try to register two component with same name: %s'
        : 'Try to create component with name engaged for property of application: %s '
      ).format( name )
    );

  this._[ name ] = component;
  this._[ name ].get = function() {
    return component
      ? component.get()
      : this.log(
        'Try to use component "%s" which is not included. \
         To include component configure it in your config file'.format( name ),
        'warning'
      )
  };

  this._[ name ].set = function( v ) {
    this.log(
      'Property "%s" in Application engaged for native autodafe\'s component. \
       You can\'t set it to "%s"'.format( name, v ),
      'warning'
    );
  }
};


Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] === undefined ? null : this._config.params[ name ];
};


Application.prototype.run = function ( callback ) {
  if ( !Object.isEmpty( this.listeners[ 'initialized' ] ) ) return false; // double run before init

  this.on( 'initialized', function(){
    this.__run( callback );
  } );
  return true;
};


Application.prototype.__run = function ( callback ) {
  callback = callback || AppModule.prototype.default_callback;

  if ( this.is_running ) return false;
  this.log( 'Running application' );
  this.emit( 'run' );
  this._.is_running = true;

  callback();

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