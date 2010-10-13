var Controller  = require( 'controller' );

var ActionController = module.exports = function( params ) {
  this._init( params );
}

require('sys').inherits( ActionController, Controller );


ActionController.prototype.name     = 'action';
ActionController.prototype.actions  = [
  'test',
  'client_connect'
];


ActionController.prototype.test = function () {
  
};


ActionController.prototype.client_connect = function ( client ) {
  this.emit( 'client_connect' );
};