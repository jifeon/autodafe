var Component = require('components/component');
var email     = require('./emailjs.git/email');
var os        = require('os');

var Mailer = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( Mailer, Component );

var message_id = 0;
Mailer.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );
  this._configured = true;

  if ( !params.smtp || !params.smtp.user || !params.smtp.pass || !params.smtp.host ) {
    this.app.log( 'You must specify smtp parametres in your config file for correct work of mailing.' +
                  ' smtp.user, smtp.pass, smtp.host are required', 'warning', 'Mailer' );
    this._configured = false;
    return false;
  }

  this._server = email.server.connect({
    user      : params.smtp.user,
    password  : params.smtp.pass,
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
    this.app.log(
      'You must specify `%s` parameter in config file or in parametres of `send` function'.format( !to ? 'to' : 'from' ),
      'warning', 'Mailer'
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
  this.app.log( 'Sending message with id=%s'.format( message.id ), 'trace', 'Mailer' );
  var self = this;
  this._server.send( message, function( e, message ){
    if ( e ) self.app.log( e, 'Mailer' );
    else self.app.log( 'Message with id=%s has been sent'.format( message.id ), 'info', 'Mailer' );
    if ( typeof callback == "function" ) callback( e, message );
  } );
};