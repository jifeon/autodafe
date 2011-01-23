var Message = module.exports = function( params ) {
  this._init( params );
};


Message.prototype._init = function( params ) {
  this.logger = global.autodafe.app.logger;

  this._e = null;
  if ( params.text instanceof Error ) {
    this._e       = params.text;
    params.text   = this._e.message;
    params.level  = 'error';
  }

  this.__defineGetter__( 'stack', function() {
    return this._e && this._e.stack;
  } );

  this.text   = params.text   || '(no text)';
  this.level  = params.level  || this.logger && this.logger.TRACE;
  this.date   = params.date   || new Date();
  this.module = params.module || 'global';
};


Message.prototype.toString = function () {
  return this.text;
};