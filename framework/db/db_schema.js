var CommandBuilder = require( './command_builder' );

module.exports = DBSchema;

function DBSchema( params ) {
  this._init( params );
}


DBSchema.prototype._init = function( params ) {
  this._tables        = {};
  this._connection    = params.connection;
  this._builder       = null;
};


DBSchema.prototype.get_db_connection = function () {
  return this._connection;
};


/**
 * Obtains the metadata for the named table.
 * @param string table name
 * @return CDbTableSchema table metadata. Null if the named table does not exist.
 */
DBSchema.prototype.get_table = function( name ) {
  return this._tables[ name ] ? this._tables[ name ] : this._tables[ name ] = this._create_table( name );
};


DBSchema.prototype._create_table = function ( name ) {};


DBSchema.prototype.get_command_builder = function () {
  return this._builder ? this._builder : this._builder = this.create_command_builder();
};


DBSchema.prototype.create_command_builder = function () {
  return new CommandBuilder({
    schema : this
  });
};

DBSchema.prototype.truncate_table = function( table_name, callback ){
  var self = this;
  this.app.db.query( 'TRUNCATE TABLE %s'.format( table_name ), callback, function( err ){
    self.app.log( err, 'warning' );
  })
};
