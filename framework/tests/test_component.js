var Component       = require( 'components/component' );
var FixturesManager = require( './db_fixtures_manager' );

var Tests = module.exports = function( params ) {
  this._init( params );
};

require('sys').inherits( Tests, Component );


Tests.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this.vows         = require('./vows/lib/vows');
  this.directory    = params.directory || false;
  this.files        = params.files || [];
  this.fixtures_dir = params.fixtures_dir || '../../tests/test_app/fixtures';
  this.fm           = new FixturesManager({
    app           : this.app,
    fixtures_dir  : this.fixtures_dir
  });
};


Tests.prototype.run = function () {
  this.app.log( 'Running tests', 'trace', 'Tests' );
  var tmp_test;
  if( !this.directory ) {

    if( this.files.length > 0 ){

      var self = this;
      this.fm.on( 'get_fixtures', function( names ){
        // add test_app folder to paths
        var path = require( 'path' );
        require.paths.unshift( path.resolve( '.' ) );

        var suite         = self.vows.describe( 'Autodafe tests' );
        suite.application = self.app;
        suite.fm          = self.fm;
        suite.fix_names   = names;

        for ( var f = 0, f_ln = self.files.length; f < f_ln; f++ ){
          var test_path = path.resolve( '../../tests', self.files[f] );
          self.app.log( 'Collecting tests in file: %s'.format( path.basename( test_path ) ), 'trace', 'Tests' );

          tmp_test = require( test_path );
          tmp_test.add_tests_to( suite );
        }
        suite.run();
      });
    }
  }
};