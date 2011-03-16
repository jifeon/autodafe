var Component = require('components/component');

var system_components = {
  'web_sockets_server' : require( '../../web_sockets/web_sockets_server' ),
  'user'               : require( '../../users/users_identities' ),
  'db'                 : require( '../../db/db_controller' ),
  'log_router'         : require( '../../logging/log_router' ),
  'tests'              : require( '../../tests/test_component' ),
  'mail'               : require( '../../mailing/mailer' )
};

var ComponentsManager = module.exports = function( components, app ) {
  this._init( components, app );
};


require( 'sys' ).inherits( ComponentsManager, process.EventEmitter );


ComponentsManager.prototype._init = function( components, app ) {
  this._components = components;
  this._items      = {};

  this.app         = app;
};


ComponentsManager.prototype.load_components = function () {

  for ( var component_name in this._components ) {
    this.load_component( component_name );
  }

  for ( component_name in system_components ) {

    if ( this._items[ component_name ] ) continue;

    this.app.__defineGetter__( component_name, function() {
      this.log(
        'Try to use component "%s" which is not included. \
         To include component configure it in your config file'.format( component_name ),
        'warning',
        'ComponentsManager'
      );
    } );

    this.app.__defineSetter__( component_name, function( v ) {
      this.log(
        'Property "%s" in Application engaged for native autodafe\'s component. \
         You can\'t set it to "%s"'.format( component_name, v ),
        'warning',
        'ComponentsManager'
      );
    } );
  }
};


ComponentsManager.prototype.load_component = function ( component_name ) {
  if ( this._items[ component_name ] ) return false;

  this.app.log( 'Load component "%s"'.format( component_name ), 'trace', 'ComponentsManager' );
  var component_params = this._components[ component_name ];
  if ( typeof component_params != 'object' ) component_params = {};

  var component_class = system_components[ component_name ];
  if ( !component_class || !( component_class.prototype instanceof Component ) ) {
    this.app.log( 'Try to load unknown component: "%s"'.format( component_name ), 'warning', 'ComponentsManager' );
    return false;
  }

  component_params.name = component_name;
  component_params.app  = this.app;
  this._items[ component_name ] = new component_class( component_params );
};