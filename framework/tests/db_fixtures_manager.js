var AppModule = global.autodafe.AppModule;

module.exports = DbFixtureManager.inherits( AppModule );

function DbFixtureManager( params ) {
  return this._init( params );
}

DbFixtureManager.prototype._init = function (params) {
  DbFixtureManager.parent._init.call(this, params);

  this.fixtures_dir = params.fixtures_dir || '../../tests/test_app/fixtures';
  this.fixtures_count = 0;
  this.fixtures = {};
  var self = this;
  this.app.db.query('SET foreign_key_checks=0', function () {
    self.get_fixtures();
  });
  this.on('get_fixture', function (msg) {
    self.log(msg);
    if (--self.fixtures_count == 0) {
      self.log('All fixtures are loaded');
      self.emit('get_fixtures', true);
    }
  })
  return this;
};

DbFixtureManager.prototype.get_fixtures = function () {
  var path = require( 'path' );
  var self = this;
  var fs = require('fs');
  var dir = this.fixtures_dir;
  var f_name, fixture;
  fs.exists( dir, function( exists ) {
    if( !exists ){
      self.log('Fixtures dir does not exist', 'warning');
      self.emit( 'get_fixtures', false );
      return;
    }
    fs.readdir( dir, function( err, files ){
      if( !files.length || files.length == 0 || err ){
        self.log( 'There are no fixtures files', 'warning' );
        self.emit( 'get_fixtures', false );
        return;
      }
      for( var f = 0, f_ln = files.length; f < f_ln; f++ ){
        f_name = path.basename( files[ f ], '.js' );
        fixture = require( dir + '/' + f_name );
        self.fixtures[ f_name ] = fixture;
        self.fixtures_count++;
        }
      self.load_fixtures();
      });
  });
};

DbFixtureManager.prototype.get_fixture = function (table_name) {
  var result = {};
  var keys = Object.keys(this.fixtures[ table_name ]);
  var values = _.values(this.fixtures[ table_name ]);
  for (var v = 0, ln_v = values[ 0 ].length; v < ln_v; v++)
    for (var k = 0, ln_k = keys.length; k < ln_k; k++) {
      if (!result[ v ]) result[ v ] = {};
      result[ v ][ keys[ k ] ] = values[ k ][ v ];
    }
  return result;
};

DbFixtureManager.prototype.load_fixtures = function(){
  var self = this;
  for( var table_name in this.fixtures ) {
      this.load_fixture( table_name, function( msg ){
        self.emit( 'get_fixture', msg );
      });
  }
};

DbFixtureManager.prototype.load_fixture = function( table_name, callback ){
  var schema  = this.app.db.db_schema;
  var builder = schema.command_builder;
  var self = this;
  callback = ( callback instanceof Function ) ? callback : function( msg ){ self.log( msg ) };

  schema.get_table( table_name, function( err, table ) {
    self.app.db.query( schema.truncate_table( table_name ), function( e, res ){
      if( e ) {
        callback( e );
        return;
      }
      var command = builder.create_insert_command( table, self.fixtures[ table_name ] );
      command.execute( function( e ){
        callback( e ? e : 'fixture %s is loaded'.format( table_name ) );
      });
    })
  } );
};