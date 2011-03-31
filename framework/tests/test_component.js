var Component   = require( 'components/component' );
var TestsBatch  = require( 'tests/tests_batch' );
var path        = require( 'path' );
var fs          = require( 'fs' );
var assert      = require( 'assert' );
var FixtureManager          = require( 'tests/db_fixtures_manager' );


var TestComponent = module.exports = function( params ) {
  this._init( params );
};

require('sys').inherits( TestComponent, Component );


TestComponent.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this.vows       = require('./vows/lib/vows');
  this.paths      = params.paths    || [];
  this.exclude    = params.exclude  || [];
  this.suite      = this.vows.describe( 'Autodafe tests' );
  this.fm         = new FixtureManager({
    app : this.app
  });

};


TestComponent.prototype.run = function () {
  this.app.log( 'Collecting tests', 'trace', 'TestComponent' );

  // add test_app folder to paths
  require.paths.unshift( path.resolve( '.' ) );

  this.paths.forEach( function( test_path ) {
    test_path = path.join( this.app.base_dir, test_path );

    var test_path_origin = test_path;
    if ( !path.existsSync( test_path ) && !path.existsSync( test_path += '.js' ) ) {
      return this.app.log(
        'Path "%s" does not exist. Check your configuration file ( tests.paths )'.format( test_path_origin ),
        'error', 'TestComponent' );
    }

    this._collect_tests_in_path( test_path );
  }, this );

  this.app.log( 'Running tests', 'trace', 'TestComponent' );
  var self = this;
  this.fm.on( 'get_fixtures', function(){
    self.suite.run();
  });
};


TestComponent.prototype._collect_tests_in_path = function ( test_path ) {
  if ( this.exclude.some( function( elem ) {
    return test_path.search( elem ) != -1;
  } ) ) return false;

  var stats = fs.statSync( test_path );

  if ( stats.isDirectory() ) {
    fs.readdirSync( test_path ).forEach( function( file ) {
      this._collect_tests_in_path( path.join( test_path, file ) );
    }, this );
  }
  else if ( stats.isFile() ) {
    var test_name = path.basename( test_path, '.js' );
    this.app.log( 'Collecting tests in file: %s'.format( test_name ), 'trace', 'TestComponent' );

    var test  = require( test_path );
    if ( !test || typeof test.get_batch != 'function' ) {
      return this.app.log(
        'File with tests (%s) should contain `exports.get_batch` method'.format( test_name ),
        'error', 'TestComponent' );
    }

    new TestsBatch({
      name  : test_name.replace(/_/g, ' '),
      tests : test.get_batch( this.app, assert ),
      suite : this.suite,
      app   : this.app,
      fm    : this.fm
    });
  }
};