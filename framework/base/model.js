var Model = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( Model, process.EventEmitter );


Model.prototype._init = function ( params ) {
  params = params || {};
  this.app = params.app;
  if ( !this.app ) {
    throw new Error( 'You need specify `app` parameter when you create model instance' );
  }
};