var Component = require('components/component');

var system_components = {
  'web_sockets_server' : require( '../../web_sockets/web_sockets_server' ),
  'user'               : require( '../../users/users_identities' ),
  'db'                 : require( '../../db/db_controller' )
};

var ComponentsList = module.exports = function( components ) {
  this._init( components );
};


require( 'sys' ).inherits( ComponentsList, process.EventEmitter );


ComponentsList.prototype._init = function( components ) {
  this.items = {};

  this._init_components( components );
};


ComponentsList.prototype._init_components = function ( components ) {
  for ( var component_name in components ) {
    var component_params = components[ component_name ];
    if ( component_params === true ) component_params = {};

    var component_class = system_components[ component_name ];
    if ( !component_class || !( component_class.prototype instanceof Component ) ) {
      console.log( 'Warning! Try to load unknown component: "' + component_name + '"' );
      continue;
    }

    component_params.name = component_name;
    this.items[ component_name ] = new component_class( component_params );
  }

  for ( component_name in system_components ) {

    if ( this.items[ component_name ] ) continue;

    global.autodafe.app.__defineGetter__( component_name, function() {
      console.log( 'Warning! Try to use component "' + component_name + '" which is not included. ' +
        'To include component configure it in your config file' );
    } );

    global.autodafe.app.__defineSetter__( component_name, function( v ) {
      console.log(
        'Warning! Property "' + component_name + '" in Application engaged for native autodafe\'s module. ' +
        'You can\'t set it to "' + v + '"'
      );
    } );
  }
};