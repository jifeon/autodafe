var Message = require('./message');

var LogRoute = module.exports = function( params, app ) {
  this._init( params, app );
};


LogRoute.prototype._init = function( params, app ) {
  this.__defineGetter__( 'app', function() {
    return app;
  } );

  this.logger = this.app.logger;

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
  if ( this.levels[ message.level ] ) this.on_log( message );

  if ( message.level == this.logger.ERROR && this.levels[ this.logger.ERROR ] ) {

    if ( !this.levels[ this.logger.TRACE ] ) {
      this.on_log( new Message({
        text    : 'Application stack:',
        level   : this.logger.INFO,
        module  : 'log_route'
      }));

      this.logger.messages.latest_trace.forEach( this.on_log, this );
    }

    this.on_log( new Message({
      text    : 'JS stack:',
      level   : this.logger.INFO,
      module  : 'log_route'
    }));

    var stack = message.stack;
    if ( stack ) this.on_log( new Message({
      text    : stack,
      level   : this.logger.TRACE,
      module  : 'log_route'
    }));
    else console.trace();

    this.on_log( new Message({
      text    : '--- End of stack ---',
      level   : this.logger.INFO,
      module  : 'log_route'
    }));
  }
};


LogRoute.prototype.on_log = function ( message ) {};


LogRoute.prototype._format = function ( message ) {
  return '%s [%s] [%s] [%s] %s'.format(
    message.date.format( 'D M Y h:m:s:x' ),
    this.app.name, message.level, message.module, message.text );
};