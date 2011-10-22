module.exports = Message;

function Message( params ) {
  this._init( params );
}


Message.prototype._init = function( params ) {
  this.stack = null;

  if ( params.text instanceof Error ) {
    this.stack    = params.text.stack;
    params.text   = params.text.message;
    params.level  = params.level || 'error';
  }

  this.text   = params.text   || '(no text)';
  this.level  = params.level  || 'trace';
  this.date   = params.date   || new Date();
  this.module = params.module || 'global';
};


Message.prototype.toString = function () {
  return this.level == 'error' ? this.stack || this.text : this.text;
};