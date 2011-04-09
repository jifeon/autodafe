var AppModule = require('app_module');

module.exports = DbFixtureManager.inherits( AppModule );

function DbFixtureManager( params ) {
  return this._init( params );
}

DbFixtureManager.prototype._init = function( params ){
  this.super_._init( params );

  this.fixtures_dir = params.fixtures_dir || '../../tests/test_app/fixtures';
  this.current_fixture_count = 0;
  this.get_fixtures();
  return this;
}

DbFixtureManager.prototype.get_fixtures = function () {
//  var emitter = new process.EventEmitter;
  var path = require( 'path' );
  var self = this;
  this.fixtures = {};
  var fs = require('fs');
  var dir = this.fixtures_dir;
  var f_name, fixture;
  path.exists( dir, function( exists ) {
    if( exists ){
      fs.readdir( dir, function( err, files ){
        if( files.length > 0 ){
          for( var f = 0, f_ln = files.length; f < f_ln; f++ ){
            f_name = path.basename(files[ f ], '.js' );
            fixture = require( dir + '/' + f_name );
            self.fixtures[ f_name ] = fixture;
            self.fixtures[ f_name ].fixtures_names = [];
            for( var f in fixture ){
              self.fixtures[ f_name ].fixtures_names.push( f );
            }
          }
      } else {
          self.log( 'There is no fixtures files', 'warning' );
        }
        //self.load_fixtures();
          self.emit( 'get_fixtures', Object.keys( self.fixtures ) );
      });
    } else {
      self.log('Fixtures dir does not exist', 'warning');
      self.emit( 'get_fixtures', false );
    }
  });
//  return emitter;
};

DbFixtureManager.prototype.load_fixtures = function( /*emitter*/ ){
  var self = this;
  for( table_name in this.fixtures ) {
      this.load_fixture( table_name/*, emitter*/ );
  }
};

DbFixtureManager.prototype.load_fixture = function( table_name/*, emitter */){
  var schema  = this.app.db.db_schema;
  var builder = schema.command_builder;
  var self = this;
  schema.get_table( table_name, function() {
    self.app.db.query( schema.truncate_table( table_name ), function( res ){
      if( res != undefined ){
        var fixtures = self.fixtures[ table_name ];
        self.current_fixture_count = fixtures.fixtures_names.length - 1;
        self.insert( fixtures, builder, table, 0);
      }
    })
  } );
};

DbFixtureManager.prototype.insert = function( fixtures, builder, table, counter ){
  if( counter < this.current_fixture_count ){
    var command = builder.create_insert_command( table, fixtures[ fixtures.fixtures_names[ counter ] ] );
    var self = this;
    command.execute( function(){
      self.insert( fixtures, builder, table, ++counter )
    } );
  } else {
    this.emit( 'load_fixture' );
  }
}