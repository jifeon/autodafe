var Controller  = require( 'controller' );

module.exports = GoodController.inherits( Controller );

function GoodController( params ) {
  this._init( params );
}


GoodController.prototype.name     = 'good';
GoodController.prototype.actions  = [
  'test'
];


GoodController.prototype.test = function() {
  this.app.emit( 'good.test' );
};