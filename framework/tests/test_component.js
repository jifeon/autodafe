var Component = require( 'components/component' );

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

      // add test_app folder to paths
      var path = require( 'path' );
      require.paths.unshift( path.resolve( '.' ) );

      var suite         = this.vows.describe( 'Autodafe tests' );
      suite.application = this.app;

      for ( var f = 0, f_ln = this.files.length; f < f_ln; f++ ){
        var test_path = path.resolve( '../../tests', this.files[f] );
        this.app.log( 'Collecting tests in file: %s'.format( path.basename( test_path ) ), 'trace', 'Tests' );

        tmp_test = require( test_path );
        tmp_test.add_tests_to( suite );
      }

      suite.run();
    }
  }
};
