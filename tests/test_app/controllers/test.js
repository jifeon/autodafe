var Controller  = require( 'controller' );

var ActionController = module.exports = function( params ) {
  this._init( params );
  // log_routes exists here only if it is preloaded
  process.emit( 'Preloaded logger component', this.app.log_router );
  process.emit( 'Not preloaded tests component', this.app.tests );
}

require('sys').inherits( ActionController, Controller );


ActionController.prototype.name     = 'test';
ActionController.prototype.actions  = [
];