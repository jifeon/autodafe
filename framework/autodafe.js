var tools                 = require( './lib/tools' );
var http                  = require( 'http' );

module.exports = new function() {
  global.autodafe   = this;

  this.AutodafePart     = require( './base/autodafe_part.js' );
  this.AppModule        = require( './base/app_module.js' );
  this.Component        = require( './base/components/component.js' );
  this.Controller       = require( './base/controller.js' );
  this.Model            = require( './base/model.js' );
  this.db               = {};
  this.db.Expression    = require('./db/db_expression.js');
  this.db.Criteria      = require('./db/db_criteria.js');
  this.db.ActiveRecord  = require('./db/ar/active_record.js');

  var Application           = require('./base/application.js');

  var server_by_port  = {};

  this.create_application = function( config ) {
    return new Application( config );
  };

  this.get_server = function( port, application ) {
    if ( typeof port != 'number' ) throw new Error(
      '`port` should be a number in Autodafe.get_server'
    );

    if ( !server_by_port[ port ] ) {
      server_by_port[ port ] = http.createServer();
      try {
        server_by_port[ port ].listen( port );
      }
      catch( e ) {
        application.log( 'Can not listen server on port %s'.format( port ), 'error' );
        return null;
      }
    }

    return server_by_port[ port ];
  };

  var show_log_on_exit = process.argv[ 2 ] == '--show_log_on_exit';

  var self = this;
  process.on( 'exit', function() {
    var shown_some_log = false;
    var instance, i, i_ln;

    for ( i = 0, i_ln = Application.instances.length; i < i_ln; i++ ) {
      instance = Application.instances[i];
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

    Application.instances.forEach( function( app ) {
      app.close();
    } );
  } );
};