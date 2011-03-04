var path              = require('path');

var Router            = require('router');
var Logger            = require('../logging/logger');
var ComponentsManager = require('components/components_manager');

var Application = module.exports = function( config ) {
  if ( Application.instance ) return Application.instance;
  Application.instance = this;
  
  this._init( config );
}


Application.instance = null;


require( 'sys' ).inherits( Application, process.EventEmitter );


Application.prototype._init = function ( config ) {
  this._config    = config              || {};

  this.name       = this._config.name || 'My Autodafe application';
  this.logger     = new Logger;
  this.router     = null;
  this.components = null;

  this.default_controller = this._config.default_controller || 'action';

  this._preload_components();
  if ( !this._check_config() ) return false;

  this._init_core();
  this._init_components();
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

  this.router = new Router( this._config.router );
  this.log( 'Core is initialized', 'info' );
};


Application.prototype._preload_components = function () {
  this.log( 'Preload components', 'trace' );
  this.components = new ComponentsManager( this._config.components );

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
  return this._config.params[ name ] || null;
};


Application.prototype.run = function () {
  this.log( 'Running application', 'trace' );
  this.emit( 'run' );
};


Application.prototype.log = function ( message, level, module ) {
  this.logger.log( message, level, module );
};