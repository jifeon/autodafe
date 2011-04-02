var DbTableSchema = require( '../db_table_schema' );

module.exports = MysqlTableSchema.inherits( DbTableSchema );

function MysqlTableSchema( params ) {
  this._init( params );
}


MysqlTableSchema.prototype._init = function( params ) {
  this.super_._init( params );

  this.schema_name  = null; // name of other database

  this._initialized = false;

  this._resolve_table_name( params.name );
  this._find_columns();

  var self = this;
  this.on( 'initialized', function() {
    self.log( 'Table "%s" initialized'.format( this.name ) );
  } );
};


MysqlTableSchema.prototype.is_initialized = function () {
  return this._initialized;
};


MysqlTableSchema.prototype._resolve_table_name = function( name ) {
  if ( typeof name != "string" || !name ) return this.log(
    new Error( 'You can\'t create table without name' )
  );

  var parts = name.replace( '`', '' ).split( '.' );
  if ( parts[1] ) {
    this.schema_name = parts[0];
    this.name        = parts[1];
    this.raw_name    = this.db_schema.quote_table_name( this.schema_name ) + '.' + this.db_schema.quote_table_name( this.name );
  }
  else {
    this.name      = parts[0];
    this.raw_name  = this.db_schema.quote_table_name( this.name );
  }
}


MysqlTableSchema.prototype._find_columns = function() {
  var sql             = 'SHOW COLUMNS FROM ' + this.raw_name;
  var columns_emitter = this.db_schema.get_db_connection().create_command( sql ).execute();
  var self            = this;

  columns_emitter.on( 'complete', function( result, db ) {

    db.fetch_obj( result, function( column ) {
      var col = self.db_schema._create_column( column );
      self.columns[ col.name ] = col;

      if ( col.is_primary_key ) {

        if ( self.primary_key == null )
          self.primary_key = col.name;

        else if ( typeof self.primary_key == "string" )
          self.primary_key = [ self.primary_key, col.name ];

        else
          self.primary_key.push( col.name );

        if ( column['Extra'].toLowerCase().indexOf( 'auto_increment' ) != -1 )
          self.sequence_name = '';
      }
    });

    self._initialized = true;
    self.emit( 'initialized' );
  } );

  return columns_emitter;
}