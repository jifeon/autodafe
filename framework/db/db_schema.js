var CommandBuilder = require( './command_builder' );
var AppModule      = require( 'app_module' );
var DbConnection   = require( 'db/db_connection' );

module.exports = DbSchema.inherits( AppModule );

function DbSchema() {
  throw new TypeError( 'You can\'t instantiate abstract class DbSchema' );
}


DbSchema.prototype._init = function( params ) {
  this.super_._init( params );

  this._.db_connection = params.db_connection;
  if ( !( this.db_connection instanceof DbConnection ) )
    throw new Error( '`db_connection` in DbSchema._init should be instance of DbConnection' );

  var command_builder = null;
  Object.defineProperty( this, 'command_builder', {
    get : function() {
      return command_builder || ( command_builder = new CommandBuilder({
        db_schema : this,
        app       : this.app
      }) );
    },
    // uses in `refresh` to delete cached link to command builder.
    set : function( v ) {
      if ( !v ) command_builder = null;
    }
  });

  this._tables      = {};
  this._table_names = {};
};


DbSchema.prototype.get_table = function( name, callback, context ) {
  var table = this._tables[ name ];

  if ( !table ) return this._load_table( name, callback, context );

  table.setMaxListeners( 100 );

  if ( table.is_inited ) callback.call( context || null, null, table );
  else table
    .on( 'initialized', function() {
      callback.call( context || null, null, table );
    } )
    .on( 'error', function( e ) {
      callback.call( context || null, e );
    } );
};


DbSchema.prototype.get_tables = function ( schema, callback ) {
  this.get_table_names( schema, function( e, names ) {
    if ( e ) return callback( e );

    var tables = {};

    names.for_each( this.get_table, this, function( e, table ) {
      if ( e ) return callback( e );

      tables[ table.name ] = table;

      if ( Object.keys( tables ).length == names.length ) callback( null, tables );
    } );
  });
};


DbSchema.prototype.get_table_names = function ( schema, callback ) {
  schema = schema || '';

  if ( this._table_names[ schema ] ) return callback( null, this._table_names[ schema ] );

  this._find_table_names( schema, callback );
};


DbSchema.prototype.refresh = function () {
  this._tables      = {};
  this._table_names = {};

  this.command_builder = null;
};


DbSchema.prototype.quote_table_name = function ( name ) {
  if ( name.indexOf('.') == -1 ) return this.quote_simple_table_name( name );

  return name.split('.').map( this.quote_simple_table_name ).join('.');
};


DbSchema.prototype.quote_simple_table_name = function ( name ) {
  return "'" + this.connection.escape_sql_str( name ) + "'";
};


DbSchema.prototype.quote_column_name = function ( name ) {
  var prefix  = '';
  var dot_pos = name.lastIndexOf( '.' );

  if ( dot_pos != -1 ) {
    prefix = this.quote_table_name( name.substr( 0, dot_pos ) );
    name   = name.substr( dot_pos + 1 );
  }

  return prefix + ( name == '*' ? name : this.quote_simple_column_name( name ) );
};


DbSchema.prototype.get_column_type = function ( type ) {
  return this.connection.escape_sql_str( type );
};


DbSchema.prototype.quote_simple_column_name = function ( name ) {
  return '"' + this.connection.escape_sql_str( name ) + '"';
};


DbSchema.prototype.create_table = function ( table, columns, options ) {
  options = options || null;

  var cols = [];

  for ( var name in columns )
    cols.push( '\t' + this.quote_column_name( name ) + ' ' + this.get_column_type( columns[ name ] ) );

  var sql = "CREATE TABLE %s (%s)".format( this.quote_table_name( table ), '\n' + cols.join('\n') + '\n' );
  return options == null ? sql : sql + ' ' + options;
};


DbSchema.prototype.rename_table = function ( table, new_name ) {
  return "RENAME TABLE %s TO %s".format( this.quote_table_name( table ), this.quote_table_name( new_name ) );
};


DbSchema.prototype.drop_table = function ( table ) {
  return "DROP TABLE " + this.quote_table_name( table );
};


DbSchema.prototype.truncate_table = function ( table ) {
  return "TRUNCATE TABLE " + this.quote_table_name( table );
};


DbSchema.prototype.add_column = function ( table, column, type ) {
  return "ALTER TABLE %s ADD %s %s".format(
    this.quote_table_name( table ),
    this.quote_column_name( column ),
    this.get_column_type( type )
  );
};


DbSchema.prototype.drop_column = function ( table, column ) {
  return "ALTER TABLE %s DROP COLUMN %s".format(
    this.quote_table_name( table ),
    this.quote_column_name( column )
  );
};


DbSchema.prototype.rename_column = function ( table, name, new_name ) {
  return "ALTER TABLE %s RENAME COLUMN %s TO %s".format(
    this.quote_table_name( table ),
    this.quote_column_name( name ),
    this.quote_column_name( new_name )
  );
};


DbSchema.prototype.create_index = function ( name, table, column, unique ) {
  unique = unique || false;

  var columns = column.split( /\s*,\s*/ ).map( this.quote_column_name, this ).join(',');

  return ( unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX" ) + " %s ON %s (%s)".format(
    this.quote_table_name( name ),
    this.quote_table_name( table ),
    columns
  );
};


DbSchema.prototype.drop_index = function ( name, table ) {
  return "DROP INDEX %s ON %s".format(
    this.quote_table_name( name ),
    this.quote_table_name( table )
  );
};


DbSchema.prototype._find_table_names = function ( schema, callback ) {
  throw new Error( '`%s` does not support fetching all table names.'.format( this.class_name ) );
};


DbSchema.prototype._load_table = function ( name, callback ) {
  throw new Error( 'You must implement `_load_table` method in `%s`'.format( this.class_name ) );
};
