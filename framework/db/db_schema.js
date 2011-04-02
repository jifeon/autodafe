var CommandBuilder = require( './command_builder' );
var AppModule      = require( 'app_module' );

module.exports = DbSchema.inherits( AppModule );

function DbSchema( params ) {
  this._init( params );
}


DbSchema.prototype._init = function( params ) {
  this.super_._init( params );

  this._tables        = {};
  this._connection    = params.connection;
  this._builder       = null;
};


DbSchema.prototype.get_db_connection = function () {
  return this._connection;
};


/**
 * Obtains the metadata for the named table.
 * @param string table name
 * @return CDbTableSchema table metadata. Null if the named table does not exist.
 */
DbSchema.prototype.get_table = function( name ) {
  return this._tables[ name ] ? this._tables[ name ] : this._tables[ name ] = this._create_table( name );
};


DbSchema.prototype._create_table = function ( name ) {};


DbSchema.prototype.get_command_builder = function () {
  return this._builder ? this._builder : this._builder = this.create_command_builder();
};


DbSchema.prototype.create_command_builder = function () {
  return new CommandBuilder({
    schema : this
  });
};

DbSchema.prototype.truncate_table = function( table_name, callback ){
  var self = this;
  this.app.db.query( 'TRUNCATE TABLE %s'.format( table_name ), callback, function( err ){
    self.app.log( err, 'warning' );
  })
};
