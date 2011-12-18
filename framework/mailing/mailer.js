var Component = global.autodafe.Component;
var email     = require('emailjs');
var os        = require('os');

module.exports = Mailer.inherits( Component );

function Mailer( params ) {
  this._init( params );
}


var message_id = 0;
Mailer.prototype._init = function( params ) {
  Mailer.parent._init.call( this, params );
  this._configured = true;

  this._server = email.server.connect({
    user      : params.smtp.user || null,
    password  : params.smtp.pass || null,
    host      : params.smtp.host || 'localhost',
    port      : params.smtp.port || null,
    ssl       : params.smtp.ssl  || false,
    tls       : params.smtp.tls == undefined ? true : params.smtp.tls,
    domain    : os.hostname()
  });

  this._default_message = params.default_message || {};
};


Mailer.prototype.send = function ( params, callback ) {
  if ( !this._configured ) return false;

  params   = params || {};
  var text = typeof params == "string" ? params : params.text;
  var to   = params.to    || this._default_message.to;
  var from = params.from  || this._default_message.from;

  if ( !to || !from ) {
    this.log(
      'You must specify `%s` parameter in config file or in parameters of `send` function'.format( !to ? 'to' : 'from' ),
      'warning'
    );
    return false;
  }

  var message = email.message.create({
    text    : text,
    from    : from,
    to      : to,
    subject : params.subject || this._default_message.subject
  });

  if (
    params.html
    || params.attachments   // dirty hack for mailerjs
  ) {
    message.attach_alternative( params.html || '&nbsp;' );
  }

  if ( params.attachments && params.attachments.length ) {
    var attachs = params.attachments;
    for ( var a = 0, a_ln = attachs.length; a < a_ln; a++ ) {
      var attach = attachs[ a ];
      message.attach( attach.path, attach.type, attach.name );
    }
  }

  message.id = message_id++;
  this.log( 'Sending message with id=%s'.format( message.id ) );
  var self = this;
  this._server.send( message, function( e, message ){
    if ( e ) {
      self.log( 'Message with id=%s has not been sent'.format( message.id ), 'warning' );
      self.log( e.error );
    }
    else self.log( 'Message with id=%s has been sent'.format( message.id ), 'info' );

    if ( typeof callback == "function" ) callback( e, message );
  } );
};