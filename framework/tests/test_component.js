var Component = require('components/component');
var Tests = module.exports = function( params ) {
  this._init( params );
};

require('sys').inherits( Tests, Component );


Tests.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this.vows       = require('./vows/lib/vows');
  this.directory  = params.directory || false;
  this.files      = params.files || [];
};


Tests.prototype.run = function () {
  this.app.log( 'Running tests', 'trace', 'Tests' );

  var tmp_test;
  if( !this.directory ) {

    if( this.files.length > 0 ){

      for( var f = 0, f_ln = this.files.length; f < f_ln; f++ ){
        tmp_test = require( '../../tests/' + this.files[f]);
        tmp_test.test( this.app );
      }
    }
  }
};
