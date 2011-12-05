var Component   = global.autodafe.Component;
var TestsBatch  = require( './tests_batch' );
var path        = require( 'path' );
var fs          = require( 'fs' );
var assert      = require( 'assert' );
var FixtureManager = require( './db_fixtures_manager' );

module.exports = TestComponent.inherits( Component );

function TestComponent( params ) {
  this._init( params );
}


TestComponent.prototype._init = function( params ) {
  this.super_._init( params );

  this.vows       = require('vows');
  this.paths      = params.paths    || [];
  this.exclude    = params.exclude  || [];
  this.suite      = this.vows.describe( 'Autodafe tests' );
  this.fm         = new FixtureManager({
    app : this.app
  });

  this._extend_assert();
};


TestComponent.prototype._extend_assert = function () {
  assert.isReadOnly = function ( actual, actual_property, message ) {
    var writable  = true;

    try {
      actual[ actual_property ] = null;
    }
    catch( e ) {
      writable = false;
    }

    var removable = delete actual[ actual_property ];

    if ( writable || removable ) {
        assert.fail( actual_property, 0, message || "expected {actual} to be read only", "isReadOnly", assert.isReadOnly );
    }
  };

  assert.isError = function ( actual, message ) {
    assert.instanceOf( actual, Error, message );
  };
};


TestComponent.prototype.run = function () {
  this.log( 'Collecting tests' );

  // add test_app folder to paths
  require.paths.unshift( path.resolve( '.' ) );

  this.paths.forEach( function( test_path ) {
    test_path = path.join( this.app.base_dir, test_path );

    var test_path_origin = test_path;
    if ( !path.existsSync( test_path ) && !path.existsSync( test_path += '.js' ) ) {
      return this.log(
        'Path "%s" does not exist. Check your configuration file ( tests.paths )'.format( test_path_origin ),
        'error' );
    }

    this._collect_tests_in_path( test_path );
  }, this );

  this.log( 'Running tests' );
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
    this.log( 'Collecting tests in file: %s'.format( test_name ) );

    var test  = require( test_path );
    if ( !test || typeof test.get_batch != 'function' ) {
      return this.log(
        'File with tests (%s) should contain `exports.get_batch` method'.format( test_name ),
        'error' );
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