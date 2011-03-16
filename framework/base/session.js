var Session = module.exports = function( params ) {
  this._init( params );
};


Session.cache = {};

Session.get_by_id = function( id ) {
  return this.cache[ id ] || null;
};


Session.prototype._init = function( params ) {
  this.app = params.app;

  if ( typeof params.id == 'undefined' ) {
    this.app.log( 'Try to create session without id', 'error', 'Session' );
    return false;
  }

  this.id                   = params.id;
  Session.cache[ this.id ]  = this;
};