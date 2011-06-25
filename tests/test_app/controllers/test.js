var Controller  = require( 'controller' );

module.exports = TestController.inherits( Controller );

function TestController( params ) {
  this._init( params );
  this.allow_actions( 'test', 'ws_test', 'not_existed_test_action', 'connect_client' );

  // log_routes exists here only if it is preloaded
  process.emit( 'Preloaded logger component', this.app.log_router );
  process.emit( 'Not preloaded tests component', this.app.tests );
}


TestController.prototype.index = function () {
  this.emit( 'index action' );
};


TestController.prototype.test = function () {
  this.emit( 'test action', arguments );
  this.app.emit( 'test.test', arguments );
};


TestController.prototype.ws_test = function () {
  this.emit( 'ws_test', arguments );
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


TestController.prototype.connect_client = function ( client, session ) {
  this.emit( 'connect_client', client, session );
};