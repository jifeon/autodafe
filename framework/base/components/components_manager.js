var AppModule = require('app_module');
var Component = require('components/component');

var system_components = {
  'web_sockets_server' : require( '../../web_sockets/web_sockets_server' ),
  'user'               : require( '../../users/users_identities' ),
  'db'                 : require( '../../db/db_controller' ),
  'log_router'         : require( '../../logging/log_router' ),
  'tests'              : require( '../../tests/test_component' ),
  'mail'               : require( '../../mailing/mailer' )
};

module.exports = ComponentsManager.inherits( AppModule );


function ComponentsManager( params ) {
  this._init( params );
}


ComponentsManager.prototype._init = function( params ) {
  this.super_._init( params );

  this._components = params.components;
  this._items      = {};
};


ComponentsManager.prototype.load_components = function () {

  for ( var component_name in this._components ) {
    this.load_component( component_name );
  }

  for ( var name in system_components )
    if ( !this._items[ name ] ) this.app.register_component( name );
};


ComponentsManager.prototype.load_component = function ( component_name ) {
  if ( this._items[ component_name ] ) return false;

  this.log( 'Load component "%s"'.format( component_name ), 'trace' );
  var component_params = this._components[ component_name ];
  if ( typeof component_params != 'object' ) component_params = {};

  var component_class = system_components[ component_name ];
  if ( !component_class || !( component_class.prototype instanceof Component ) ) {
    this.log( 'Try to load unknown component: "%s"'.format( component_name ), 'warning' );
    return false;
  }

  component_params.name = component_name;
  component_params.app  = this.app;

  var component                 = new component_class( component_params );
  this._items[ component_name ] = component;
  this.app.register_component( component_name, component );
};