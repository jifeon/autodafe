var DBSchema          = require( '../db_schema' );
var MysqlTableSchema  = require( './mysql_table_schema' );
var MysqlColumnSchema = require( './mysql_column_schema' );

var MysqlSchema = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( MysqlSchema, DBSchema );


MysqlSchema.prototype._init = function( params ) {
  DBSchema.prototype._init.call( this, params );
};


MysqlSchema.prototype.quote_table_name = function( name ) {
  return '`' + name + '`';
}


MysqlSchema.prototype.quote_column_name = function( name ) {
  return '`' + name + '`';
}


MysqlSchema.prototype._create_table = function( name ) {
  var table = new MysqlTableSchema({
    app : this.app
  });
  this._resolve_table_names( table, name );

  var self = this;

  this._find_columns( table );

  return table;
}


MysqlSchema.prototype._resolve_table_names = function( table, name ) {
  var parts = name.replace( '`', '' ).split( '.' );
  if ( parts[1] ) {
    table.schema_name = parts[0];
    table.name        = parts[1];
    table.raw_name    = this.quote_table_name( table.schema_name ) + '.' + this.quote_table_name( table.name );
  }
  else {
    table.name      = parts[0];
    table.raw_name  = this.quote_table_name( table.name );
  }
}


MysqlSchema.prototype._find_columns = function( table ) {
  var sql             = 'SHOW COLUMNS FROM ' + table.raw_name;
  var columns_emitter = this.get_db_connection().create_command( sql ).execute();

  var schema = this;

  columns_emitter.on( 'complete', function( result, db ) {

    db.fetch_obj( result, function( column ) {
      var c = schema._create_column( column );
      table.columns[ c.name ] = c;

      if ( c.is_primary_key ) {

        if ( table.primary_key == null )
          table.primary_key = c.name;

        else if ( typeof table.primary_key == "string" )
          table.primary_key = [ table.primary_key, c.name ];

        else
          table.primary_key.push( c.name );

        if ( column['Extra'].toLowerCase().indexOf( 'auto_increment' ) != -1 )
          table.sequence_name = '';
      }
    });

    table.set_initialized();
  } );

  return columns_emitter;
}


MysqlSchema.prototype._create_column = function( column ) {
  var c             = new MysqlColumnSchema;

  c.name            = column['Field'];
  c.raw_name        = this.quote_column_name( c.name );
  c.allow_null      = column['Null'] == 'YES';
  c.is_primary_key  = column['Key'].indexOf( 'PRI' ) != -1;

  c.deferred_init( column['Type'], column['Default'] );

  return c;
}