var Model = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( Model, process.EventEmitter );


