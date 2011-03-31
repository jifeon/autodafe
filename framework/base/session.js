var AppModule = require('app_module');

module.exports = Session.inherits( AppModule );

function Session( params ) {
  this._init( params );
}


Session.cache = {};

Session.get_by_id = function( id ) {
  return this.cache[ id ] || null;
};


Session.prototype._init = function( params ) {
  this.super_._init( params );

  if ( typeof params.id == 'undefined' ) {
    this.log( 'Try to create session without id', 'error' );
    return false;
  }

  this.id                   = params.id;
  Session.cache[ this.id ]  = this;
};