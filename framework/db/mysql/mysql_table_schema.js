var DbTableSchema     = require( '../db_table_schema' );
var MysqlColumnSchema = require( './mysql_column_schema' );

module.exports = MysqlTableSchema.inherits( DbTableSchema );

function MysqlTableSchema( params ) {
  this._init( params );
}


MysqlTableSchema.prototype._init = function( params ) {
  this.super_._init( params );

  this.db_schema_name = null; // name of other database

  this._resolve_table_name( params.name );
  this._find_columns();

  this.on( 'initialized', function() {
    this.log( 'Table "%s" has initialized'.format( this.name ) );
  } );
};


MysqlTableSchema.prototype._resolve_table_name = function( name ) {
  if ( typeof name != "string" || !name ) throw new Error( 'You can\'t create table without name' );

  var parts = name.replace( '`', '' ).split( '.' );
  if ( parts[1] ) {
    this._.db_schema_name = parts[0];
    this._.name           = parts[1];
    this._.raw_name       = this.db_schema.quote_table_name( this.db_schema_name ) + '.' +
                            this.db_schema.quote_table_name( this.name );
  }
  else {
    this._.name           = parts[0];
    this._.raw_name       = this.db_schema.quote_table_name( this.name );
  }
}


MysqlTableSchema.prototype._find_columns = function() {
  var sql             = 'SHOW COLUMNS FROM ' + this.raw_name;
  var columns_emitter = this.db_schema.db_connection.create_command( sql ).execute();
  var self            = this;

  columns_emitter.on( 'complete', function( result, db ) {

    result.fetch_obj( function( column ) {
      var col = self._create_column( column );
      self._columns[ col.name ] = col;

      if ( col.is_primary_key ) {

        if ( self.primary_key == null )
          self.primary_key = col.name;

        else if ( typeof self.primary_key == "string" )
          self.primary_key = [ self.primary_key, col.name ];

        else
          self.primary_key.push( col.name );

        if ( column['Extra'].toLowerCase().indexOf( 'auto_increment' ) != -1 )
          self.in_sequence = true;
      }
    });

    self.emit( 'initialized' );
  } );
}


MysqlTableSchema.prototype._create_column = function( column ) {
  return new MysqlColumnSchema({
    name           : column['Field'],
    allow_null     : column['Null'] == 'YES',
    is_primary_key : column['Key'].indexOf( 'PRI' ) != -1,
    db_type        : column['Type'],
    default_value  : column['Default'],
    db_schema      : this.db_schema,
    app            : this.app
  });
}
