var Controller  = global.autodafe.Controller;

module.exports = AnotherTestController.inherits( Controller );

function AnotherTestController( params ) {
  this._init( params );
}

AnotherTestController.prototype.test = function() {
  this.app.emit( 'another_test.test', arguments );
};