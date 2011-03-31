require.paths.unshift( __dirname );
require.paths.unshift( __dirname + '/base/' );

var tools                 = require( './lib/tools' );
var Application           = require( 'application' );

var Autodafe = global.autodafe = module.exports = new function() {

  this.create_application = function( config ) {
    return new Application( config );
  };

  var show_log_on_exit = process.argv[ 2 ] == '--show_log_on_exit';

  process.on( 'exit', function() {
    var shown_some_log = false;

    for ( var i = 0, i_ln = Application.instances.length; i < i_ln; i++ ) {
      var instance = Application.instances[i];
      if ( instance.log_router && instance.log_router.get_route('console') ) {
        shown_some_log = true;
        break;
      }
    }

    if ( !show_log_on_exit && !shown_some_log )
      console.log(
        'If you don\'t look any log messages, preload and configure "log_router" component ' +
        'or run the application with --show_log_on_exit option' );

    else if ( show_log_on_exit && Application.instance && Application.instance.logger )
      Application.instance.logger.messages.forEach( function( message ) {
        console.log( '%s: "%s" in module "%s"', message.level, message.text, message.module );
      } );
  } );
};