module.exports = Test.inherits( autodafe.Controller );

function Test( params ) {
  this._init( params );

  // log_routes exists here only if it is preloaded
  process.emit( 'Preloaded logger component', this.app.log_router );
  process.emit( 'Not preloaded tests component', this.app.tests );
}


Test.prototype.before_action = function ( action ) {
  this.emit( 'action', action );
};


Test.prototype.connect_client = function ( client ) {
  this.emit( 'connect_client', client );
};


Test.prototype.index = function () {};


Test.prototype.test = function () {
  this.emit( 'test', arguments );
  this.app.emit( 'test.test', arguments );
};


Test.prototype.ws_test = function () {
  this.emit( 'ws_test', arguments );
};


Test.prototype.some_implemented_action = function () {
  this.emit( 'some implemented action' );
};


Test.prototype.test_http = function ( response ) {
  response.client.send( 'text' );
};


Test.prototype.test_client_connection = function( response, request ){
  response.client.send( request.params );
};


Test.prototype.redirect_action = function( response ){
  this.action( 'test', response );
}