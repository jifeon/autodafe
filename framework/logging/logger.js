var Message = require('./message');

var Logger = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( Logger, process.EventEmitter );


Logger.prototype.INFO     = 'info';
Logger.prototype.TRACE    = 'trace';
Logger.prototype.WARNING  = 'warning';
Logger.prototype.ERROR    = 'error';


Logger.prototype._init = function( params ) {
  this._messages            = [];
  this._max_messages        = 1024;
  this._splice_count        = 100;
  this._latest_trace_count  = 20;
  this._new_message_count   = 0;

  this.default_module_name = 'Application';

  this.__defineGetter__( 'messages', function() {
    return this._messages;
  } );

  var self = this;
  this._messages.__defineGetter__( 'latest_trace', function() {
    var messages = [];
    for ( var m = this.length - 1; m >= 0 || messages.length >= self._latest_trace_count; m-- ) {
      var message = this[ m ];
      if ( message.level != message.logger.ERROR ) {
        message = new Message( message );
        var i = messages.push( message );
        message.text = '#%s - %s'.format( i, message );
      }
    }

    return messages;
  } )
};


Logger.prototype.log = function ( text, level, module ) {
  var is_error = text instanceof Error;

  var message = new Message({
    text    : text,
    level   : is_error ? level || 'error' : level,
    module  : module  || this.default_module_name
  });

  var messages_count = this._messages.push( message );
  this.emit( 'log', message );

  this._new_message_count++;
  if ( messages_count >= this._max_messages ) this.flush();
};


Logger.prototype.flush = function () {
  if ( this._new_message_count >= this._max_messages ) {
    this.emit( 'flush', this._messages );
    this._new_message_count = 0;
  }
  this._messages.splice( 0, this._splice_count );
};