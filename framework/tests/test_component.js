var TestsBatch  = require( './tests_batch' );
var path        = require( 'path' );
var fs          = require( 'fs' );
var assert      = require( 'assert' );

module.exports = TestComponent.inherits( autodafe.Component );

function TestComponent( params ) {
  this._init( params );
}


TestComponent.prototype._init = function( params ) {
  TestComponent.parent._init.call( this, params );

  this.paths      = params.paths    || [];
  this.exclude    = params.exclude  || [];
  this.files      = [];
};


TestComponent.prototype.run = function () {
  this.log( 'Collecting tests' );

  this.paths.forEach( function( test_path ) {
    test_path = path.resolve( this.app.base_dir, test_path );

    var test_path_origin = test_path;
    if ( !path.existsSync( test_path ) && !path.existsSync( test_path += '.js' ) ) {
      return this.log(
        'Path "%s" does not exist. Check your configuration file ( tests.paths )'.format( test_path_origin ),
        'error' );
    }

    this._collect_tests_in_path( test_path );
  }, this );

  this.log( 'Running tests' );
  var util  = require('util'),
      spawn = require('child_process').spawn,
      vows  = spawn( path.resolve( __dirname, '../../node_modules/vows/bin/vows' ), this.files ),
      self  = this;

  vows.stdout.on('data', function (data) {
    console.log( data );
  });

  vows.stderr.on('data', function (data) {
    console.log( data );
  });

  vows.on('exit', function (code) {
    self.log( 'Tests are completed', 'info' );
  });
};


TestComponent.prototype._collect_tests_in_path = function ( test_path ) {
  if ( this.exclude.some( function( elem ) {
    return test_path.search( elem ) != -1;
  } ) ) return false;

  var stats = fs.statSync( test_path );

  if ( stats.isDirectory() )
    fs.readdirSync( test_path ).forEach( function( file ) {
      this._collect_tests_in_path( path.join( test_path, file ) );
    }, this );

  else if ( stats.isFile() ) this.files.push( test_path );
};