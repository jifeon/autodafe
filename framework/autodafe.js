require.paths.unshift( __dirname );
require.paths.unshift( __dirname + '/base/' );

var Application           = require( 'application' );
var tools                 = require( './lib/tools' );

var Autodafe = global.autodafe = module.exports = new function() {

  this.create_application = function( config ) {
    return new Application( config );
  };

  this.__defineGetter__( 'app', function() {
    return new Application;
  } );
};
