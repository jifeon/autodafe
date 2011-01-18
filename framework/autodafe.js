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

  var show_log_on_exit = process.argv[ 2 ] == '--show_log_on_exit';

  process.on( 'exit', function() {
    if (
      !show_log_on_exit &&
      (
        !Application.instance ||
        !Application.instance.log_router ||
        !Application.instance.log_router.get_route('console')
      ) )
      console.log(
        'If you don\'t look any log messages, preload and configure "log_router" component ' +
        'or run the application with --show_log_on_exit option' );

    else if ( show_log_on_exit && Application.instance && Application.instance.logger )
      Application.instance.logger.messages.forEach( function( message ) {
        console.log( '%s: "%s" in module "%s"', message.level, message.text, message.module );
      } );
  } );


};
