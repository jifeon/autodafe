var Controller  = require( 'controller' );

var GoodController = module.exports = function( params ) {
  this._init( params );
}

require('sys').inherits( GoodController, Controller );


GoodController.prototype.name     = 'good';
GoodController.prototype.actions  = [
  'test'
];


GoodController.prototype.test = function() {
  this.app.emit( 'good.test' );
};