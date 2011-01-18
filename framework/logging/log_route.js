var Message = require('./message');

var LogRoute = module.exports = function( params ) {
  this._init( params );
};


LogRoute.prototype._init = function( params ) {
  this.logger = global.autodafe.app.logger;

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
  if ( message.level == this.logger.ERROR && !this.levels[ this.logger.TRACE ] ) {
    this.on_log( new Message({
      text    : 'Stack trace:',
      level   : this.logger.INFO,
      module  : 'log_route'
    }));
    this.logger.messages.latest_trace.forEach( this.on_log, this );
    this.on_log( new Message({
      text    : '-- End of stack --',
      level   : this.logger.INFO,
      module  : 'log_route'
    }));
    console.trace();
  }
};


LogRoute.prototype.on_log = function ( message ) {};


LogRoute.prototype._format = function ( message ) {
  return '%s [%s] [%s] %s'.format(
    message.date.format( 'D M Y h:m:s:x' ),
    message.level, message.module, message.text );
};