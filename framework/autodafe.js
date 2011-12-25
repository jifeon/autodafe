var tools = require( './lib/tools' );

var AutodafePart = require('./base/autodafe_part');

Autodafe.inherits( AutodafePart );
function Autodafe( params ) {
  this._init( params );
}


Autodafe.prototype._init = function() {
  Autodafe.parent._init.call( this );

  global.autodafe       = this;

  this.AutodafePart     = require( './base/autodafe_part.js' );
  this.AppModule        = require( './base/app_module.js' );
  this.Component        = require( './components/component.js' );
  this.Widget           = require( './components/widget.js' );
  this.Controller       = require( './base/controller.js' );
  this.Model            = require( './base/model.js' );
  this.db               = {};
  this.db.Expression    = require('./db/db_expression.js');
  this.db.Criteria      = require('./db/db_criteria.js');
  this.db.ActiveRecord  = require('./db/ar/active_record.js');

  this._.applications   = [];

  process.on( 'exit', this.on_exit.bind( this ) );
};


Autodafe.prototype.create_application = function ( config ) {
  var Application = require('./base/application.js');
  var app = new Application( config );
  this.applications.push( app );
  return app;
};


Autodafe.prototype.on_exit = function () {
  var silent            = process.argv[2] == '--silent';
  var some_log_is_shown = this.applications.some( function( app ){
    return app.log_router.get_route( 'console' );
  } );

  if ( !silent && !some_log_is_shown ) console.log(
    'If you don\'t look any log messages, preload and configure `log_router` component. ' +
    'To hide this message run the application with `--silent` option' );

  this.applications.forEach( function( app ) {
    app.close();
  } );
};

module.exports = new Autodafe;