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


MysqlSchema.prototype._load_table = function( name, callback, context ) {
  var table = this._tables[ name ] = new MysqlTableSchema({
    db_schema : this,
    name      : name,
    app       : this.app
  });

  table
    .on( 'initialized', function() {
      callback.call( context || null, null, table );
    } )
    .on( 'error', function( e ) {
      callback.call( context || null, e, null );
    } );
}


MysqlSchema.prototype.compare_table_names = function ( name1, name2 ) {
  return this.super_.compare_table_names( name1.toLowerCase(), name2.toLowerCase() )
};


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