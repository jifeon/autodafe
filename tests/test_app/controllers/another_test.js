var Controller  = require( 'controller' );

module.exports = AnotherTestController.inherits( Controller );

function AnotherTestController( params ) {
  this._init( params );
  this.allow_actions( 'test' );
}

AnotherTestController.prototype.test = function() {
  this.app.emit( 'another_test.test', arguments );
};