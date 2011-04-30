var path                  = require('path');

var Router                = require('router');
var Logger                = require('../logging/logger');
var ComponentsManager     = require('components/components_manager');
var Component             = require('components/component');
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

  if ( !this._config.base_dir )
    throw new Error( 'You must set base_dir in config file!' );
  this._.base_dir = path.normalize( this._config.base_dir );

  this.logger     = new Logger;
  this.router     = null;
  this.components = null;

  this.default_controller = this._config.default_controller || 'action';

  this._runned = false;

  this._preload_components();
  this._init_core();
  this._init_components();

  var models_handler = new ModelsProxyHandler({
    target : {
      get_model : function( constructor, params ) {
        return models_handler.create_model( constructor, params );
      }
    },
    app    : this
  });

  this.models = models_handler.get_proxy();
};


Application.prototype._init_core = function () {
  require.paths.unshift( this.base_dir + 'models/' );

  var router_cfg = this._config.router || {};
  router_cfg.app = this;
  this.router = new Router( router_cfg );
  this.log( 'Core initialized', 'info' );
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
};


Application.prototype.register_component = function ( component ) {
  var name = component.name;

  if ( this[ name ] )
    throw new Error(
      (
        this[ name ] instanceof Component
        ? 'Try to register two component with same name: %s'
        : 'Try to create component with name engaged for property of application: %s '
      ).format( name )
    );

  Object.defineProperty( this, name, {
    get : function() {
      return component
        ? component.get()
        : this.log(
          'Try to use component "%s" which is not included. \
           To include component configure it in your config file'.format( component.name ),
          'warning'
        )
    },
    set : function( v ) {
      this.log(
        'Property "%s" in Application engaged for native autodafe\'s component. \
         You can\'t set it to "%s"'.format( name, v ),
        'warning'
      );
    }
  } )
};


Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] === undefined ? null : this._config.params[ name ];
};


Application.prototype.run = function () {
  if ( this._runned ) return false;
  this.log( 'Running application' );
  this.emit( 'run' );
  this._runned = true;
  return true;
};


Application.prototype.log = function ( message, level, module ) {
  this.logger.log( message, level, module );
};
