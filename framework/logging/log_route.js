var Message   = require('./message');
var AppModule = require('app_module');

module.exports = LogRoute.inherits( AppModule );

function LogRoute( params ) {
  this._init( params );
}


LogRoute.prototype._init = function( params ) {
  this.super_._init( params );
  
  this.logger         = this.app.logger;
  this.message_format = 'date [app_name] [level] [module] message';
  this.date_format    = 'D M Y h:m:s:x';

  this.levels = {};
  ( params.levels || [] ).forEach( function( level ){
    this.levels[ level ] = 1;
  }, this );

  var self = this;
  this.logger.on( 'log', function( message ) {
    self._log( message );
  } );

  this.logger.messages.forEach( function( message ) {
    this._log( message );
  }, this );
};


LogRoute.prototype._log = function ( message ) {
  if ( this.levels[ message.level ] ) this.log_message( message );

  if ( message.level == 'error' && this.levels[ 'error' ] ) {

    if ( !this.levels[ 'trace' ] ) {
      this.log_message( new Message({
        text    : 'Application stack:',
        level   : 'info',
        module  : 'log_route'
      }));

      this.logger.messages.latest_trace.forEach( this.log_message, this );

      this.log_message( new Message({
        text    : '--- End of stack ---',
        level   : 'info',
        module  : 'log_route'
      }));
    }
  }
};


LogRoute.prototype.log_message = function ( message ) {};


LogRoute.prototype._format = function ( message ) {
  return this.message_format.format({
    date      : message.date.format( this.date_format ),
    app_name  : this.app.name,
    level     : message.level,
    module    : message.module,
    message   : message
  });
};


LogRoute.prototype.switch_level_on = function ( level ) {
  this.log_message( new Message({
    text    : 'Switching %s level on'.format( level ),
    level   : 'info',
    module  : this.class_name
  }) );

  this.levels[ level ] = true;
};


LogRoute.prototype.switch_level_off = function ( level ) {
  this.log_message( new Message({
    text    : 'Switching %s level off'.format( level ),
    level   : 'info',
    module  : this.class_name
  }) );

  this.levels[ level ] = false;
};