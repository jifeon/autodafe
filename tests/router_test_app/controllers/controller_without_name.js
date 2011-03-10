var Controller  = require( 'controller' );

var WithoutNameController = module.exports = function( params ) {
  this._init( params );
}

require('sys').inherits( WithoutNameController, Controller );


WithoutNameController.prototype.name     = 'withoutName';
WithoutNameController.prototype.actions  = [
  'test'
];


WithoutNameController.prototype.test = function() {

};