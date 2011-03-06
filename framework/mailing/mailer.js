var Component = require('components/component');

var Mailer = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( Mailer, Component );


Mailer.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );


};