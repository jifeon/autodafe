require.paths.unshift( __dirname );
require.paths.unshift( __dirname + '/base/' );

var Application           = require( 'application' );
var WebSocketsApplication = require( './web_sockets/web_sockets_application' );
var tools                 = require( './lib/tools' );

var Autodafe = module.exports = new function() {

  this.__application = null;

  this.create_application = function( config ) {
    config = config || {};

    switch ( config.application_type ) {
      case 'WebSockets':
        this.__application = new WebSocketsApplication( config );
        break;

      default:
        this.__application = new Application( config );
        break;
    }

    return this.__application;
  };

  this.app = function() {
    return this.__application;
  };
};
