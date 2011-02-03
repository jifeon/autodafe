var Model = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( Model, process.EventEmitter );


Model.prototype._init = function ( params ) {

};


Model.prototype.__defineGetter__( 'app', function() {
  return global.autodafe.app;
} );