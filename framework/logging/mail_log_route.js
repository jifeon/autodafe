var LogRoute = require('./log_route');

module.exports = MailLogRoute.inherits( LogRoute );

function MailLogRoute( params ) {
  this._init( params );
}


MailLogRoute.prototype._init = function( params ) {
  this._log_cache     = [];
  this._level2color = {
    trace   : 'black',
    info    : 'blue',
    warning : 'magenta',
    error   : 'red'
  };
  
  MailLogRoute.parent._init.call( this, params );

  this._interval_id   = null;
  this._to            = params.to;
  this._from          = params.from;
  this._subject       = params.subject || this.app.name + ' logs';
  this._frequency     = Number.frequency_to_period( params.frequency );
  this._write_logs    = true;

  var self = this;
  setTimeout( function() {
    self._start_process_logs();
  }, 1000 );
};


MailLogRoute.prototype.log_message = function ( message ) {
  if ( this.app.mail && message.module == this.app.mail.class_name ) return false;

  this._log_cache.push( this._format( message ) );
};


MailLogRoute.prototype._start_process_logs = function () {
  if ( !this._frequency.period )
    this._frequency.period = 8.64e6; // day

  var self = this;

  this._interval_id = setInterval( function() {
    self._send_logs();
  }, Math.max( this._frequency.period / this._frequency.count, 1000 ) );

  this._send_logs();
};


MailLogRoute.prototype._send_logs = function () {
  if ( !this._log_cache.length ) return false;

  this.app.mail.send({
    to      : this._to,
    from    : this._from,
    subject : this._subject,
    html    : '<div style="background: white; font-family:Verdana, Helvetica, serif; font-size:9pt;">' +
      this._log_cache.join('\n') + '</div>'
  });

  this._log_cache.length = 0;
};


MailLogRoute.prototype._format = function ( message ) {
  var text  = MailLogRoute.parent._format.call( this, message );

  var color = this._level2color[ message.level ];
  return "<div style='color : " + color + ";'>" +
    text.replace( /\n/g, "</div><div style='padding-left: 20px; color : " + color + ";'>" ) +
  "</div>"
};