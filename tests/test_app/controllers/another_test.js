var Controller  = require( 'controller' );

var AnotherTestController = module.exports = function( params ) {
  this._init( params );
}

require('sys').inherits( AnotherTestController, Controller );


AnotherTestController.prototype.name     = 'another_test';
AnotherTestController.prototype.actions  = [
  'test'
];


AnotherTestController.prototype.test = function() {
  this.app.emit( 'another_test.test', arguments );
};