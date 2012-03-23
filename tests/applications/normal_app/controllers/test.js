module.exports = TestController.inherits( autodafe.Controller );

function TestController( params ) {
  this._init( params );

  // log_routes exists here only if it is preloaded
  process.emit( 'Preloaded logger component', this.app.log_router );
  process.emit( 'Not preloaded tests component', this.app.tests );
}


TestController.prototype.before_action = function ( action, first_arg ) {
  this.emit( 'action', action );
};


TestController.prototype.after_action = function () {
  this.emit( 'after_action', arguments );
};


TestController.prototype.connect_client = function ( client ) {
  this.emit( 'connect_client', client );
};


TestController.prototype.index = function () {};


TestController.prototype.test = function () {
  this.emit( 'test', arguments );
  this.app.emit( 'test.test', arguments );
};


TestController.prototype.ws_test = function () {
  this.emit( 'ws_test', arguments );
};


TestController.prototype.some_implemented_action = function () {
  this.emit( 'some implemented action' );
};


TestController.prototype.test_http = function ( params, client ) {
  client.send( 'text' );
};


TestController.prototype.test_client_connection = function( params, client ){
  client.send( params );
};