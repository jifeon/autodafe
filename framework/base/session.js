var Session = module.exports = function( params ) {
  this._init( params );
};


Session.cache = {};

Session.get_by_id = function( id ) {
  return this.cache[ id ] || null;
};


Session.prototype._init = function( params ) {
  if ( typeof params.id == 'undefined' ) {
    console.log('Error: try to create session without id');
    return false;
  }

  this.id                   = params.id;
  Session.cache[ this.id ]  = this;
};