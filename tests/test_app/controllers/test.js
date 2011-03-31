var Controller  = require( 'controller' );

module.exports = TestController.inherits( Controller );

function TestController( params ) {
  this._init( params );
  // log_routes exists here only if it is preloaded
  process.emit( 'Preloaded logger component', this.app.log_router );
  process.emit( 'Not preloaded tests component', this.app.tests );
}


TestController.prototype.name     = 'test';
TestController.prototype.actions  = Controller.prototype.actions.concat([
  'test',
  'unexist_test_action'
]);


TestController.prototype.index = function () {
  this.emit( 'index action' );
};


TestController.prototype.test = function () {
  this.emit( 'test action', arguments );
  this.app.emit( 'test.test', arguments );
};


TestController.prototype.some_implemented_action = function () {
  this.emit( 'some implemented action' );
};


TestController.prototype.before_action = function ( action, first_arg ) {
  this.emit( 'before_action', arguments );

  switch ( first_arg ) {
    case 'do not run':
      return false;

    case 'change args':
      return [ 1, 2 ];
  }
};


TestController.prototype.after_action = function () {
  this.emit( 'after_action', arguments );
};