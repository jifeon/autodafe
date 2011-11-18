var Controller  = require( 'controller' );

module.exports = ActionController.inherits( Controller );

function ActionController( params ) {
  this._init( params );
}


ActionController.prototype.index = function ( params, client ) {
  this.send_response( 'index.html', client );
};


ActionController.prototype.line = function ( params, client ) {
  client.broadcast( 'line', params );
};