var Controller  = require( 'controller' );

module.exports = GoodController.inherits( Controller );

function GoodController( params ) {
  this._init( params );
  this.allow_actions( 'test' );
}


GoodController.prototype.test = function() {
  this.app.emit( 'good.test' );
};