var Component   = require( 'components/component' );
var TestsBatch  = require( 'tests/tests_batch' );

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
      var path    = require( 'path' );
      var assert  = require( 'assert' );
      require.paths.unshift( path.resolve( '.' ) );

      var suite         = this.vows.describe( 'Autodafe tests' );

      for ( var f = 0, f_ln = this.files.length; f < f_ln; f++ ){
        var test_path = path.resolve( '../../tests', this.files[f] );
        this.app.log( 'Collecting tests in file: %s'.format( path.basename( test_path ) ), 'trace', 'Tests' );

        tmp_test  = require( test_path );
        new TestsBatch({
          name  : path.basename( test_path ).replace(/_/g, ' '),
          tests : tmp_test.get_batch( this.app, assert ),
          suite : suite,
          app   : this.app
        });
      }

      suite.run();
    }
  }
};
