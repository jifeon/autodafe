var AutodafePart  = require('autodafe_part');
var Message       = require('./message');

module.exports = Logger.inherits( AutodafePart );


function Logger( params ) {
  this._init( params );
}


Logger.prototype._init = function( params ) {
  this.super_._init();
  
  this.default_module_name  = 'Application';
  this._.messages           = [];

  this._max_messages        = 1024;
  this._splice_count        = 100;
  this._latest_trace_count  = 20;
  this._new_message_count   = 0;

  var self = this;
  this.messages.__defineGetter__( 'latest_trace', function() {
    var messages = [];
    for ( var m = this.length - 1; m >= 0 && messages.length < self._latest_trace_count; m-- ) {
      var message = this[ m ];
      if ( message.level != 'error' ) {
        message = new Message( message );
        var i = messages.push( message );
        message.text = '  #%s - %s'.format( i, message );
      }
    }

    return messages;
  } );
};


Logger.prototype.log = function ( text, level, module ) {
  var message = new Message({
    text    : text,
    level   : level,
    module  : module  || this.default_module_name
  });

  var messages_count = this.messages.push( message );
  this.emit( 'log', message );

  this._new_message_count++;
  if ( messages_count >= this._max_messages ) this.flush();
};


Logger.prototype.flush = function () {
  if ( this._new_message_count >= this._max_messages ) {
    this.emit( 'flush', this.messages );
    this._new_message_count = 0;
  }
  this.messages.splice( 0, this._splice_count );
};