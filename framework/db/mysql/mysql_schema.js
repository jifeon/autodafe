var DbSchema          = require( '../db_schema' );
var MysqlTableSchema  = require( './mysql_table_schema' );

module.exports = MysqlSchema.inherits( DbSchema );

function MysqlSchema( params ) {
  this._init( params );
}


MysqlSchema.prototype.quote_simple_table_name = function( name ) {
  return '`' + this.db_connection.escape_sql_str( name ) + '`';
}


MysqlSchema.prototype.quote_simple_column_name = function( name ) {
  return '`' + this.db_connection.escape_sql_str( name ) + '`';
}


MysqlSchema.prototype._load_table = function( name, callback ) {
  var table = this._tables[ name ] = new MysqlTableSchema({
    db_schema : this,
    name      : name,
    app       : this.app
  });
  
  table.on( 'initialized', function( e ) {
    callback( e, table );
  } );
}


MysqlSchema.prototype._find_table_names = function ( schema, callback ) {
  var from_schema = schema
    ? ' FROM ' + this.quote_table_name( schema )
    : '';

  this.connection.create_command( 'SHOW TABLES' + from_schema ).execute( function( e, names ) {
    if ( e ) return callback( e );

    if ( schema ) names = names.map( function( name ) {
      return schema + '.' + name
    } );

    callback( null, names );
  } );
};