var path                  = require('path');

var Router                = require('router');
var Logger                = require('../logging/logger');
var ComponentsManager     = require('components/components_manager');
var ModelsProxyHandler    = require('lib/proxy/handlers/models_proxy_handler');
var AutodafePart          = require('autodafe_part');

module.exports = Application.inherits( AutodafePart );

function Application( config ) {
  this._init( config );
}


Application.instances = [];

Application.prototype._init = function ( config ) {
  this.super_._init();

  Application.instances.push( this );
  this._config    = config            || {};

  if ( !this._config.name )
    throw new Error( 'Please specify application name in your config file' );
  this._.name     = this._config.name || 'My Autodafe application';

  this.logger     = new Logger;
  this.router     = null;
  this.components = null;

  this.default_controller = this._config.default_controller || 'action';

  this._runned = false;

  this._preload_components();
  if ( !this._check_config() ) return false;

  this._init_core();
  this._init_components();

  var models_handler = new ModelsProxyHandler({
    target : get_model,
    app    : this
  });

  function get_model( constructor, params ) {
    return models_handler.create_model( constructor, params );
  }

  this.models = models_handler.get_proxy();
};


Application.prototype._check_config = function () {
  if ( !this._config.base_dir ) {
    this.log( 'You must set base_dir in config file!', 'error' );
    return false;
  }

  this._config.base_dir = path.normalize( this._config.base_dir );

  this.__defineGetter__( 'base_dir', function () {
    return this._config.base_dir;
  });

  return true;
};


Application.prototype._init_core = function () {
  require.paths.unshift( this.base_dir + 'models/' );

  var router_cfg = this._config.router || {};
  router_cfg.app = this;
  this.router = new Router( router_cfg );
  this.log( 'Core is initialized', 'info' );
};


Application.prototype._preload_components = function () {
  this.log( 'Preload components', 'trace' );

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
  this.log( 'Load components', 'trace' );
  this.components.load_components();
  this.log( 'Components are loaded', 'info' );
};


Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] === undefined ? null : this._config.params[ name ];
};


Application.prototype.run = function () {
  if ( this._runned ) return false;
  this.log( 'Running application', 'trace' );
  this.emit( 'run' );
  this._runned = true;
  return true;
};


Application.prototype.log = function ( message, level, module ) {
  this.logger.log( message, level, module );
};
