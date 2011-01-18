var Message = module.exports = function( params ) {
  this._init( params );
};


Message.prototype._init = function( params ) {
  this.logger = global.autodafe.app.logger;

  this.text   = params.text   || '(no text)';
  this.level  = params.level  || this.logger && this.logger.TRACE;
  this.date   = params.date   || new Date();
  this.module = params.module || 'global';
};


Message.prototype.toString = function () {
  return this.text;
};