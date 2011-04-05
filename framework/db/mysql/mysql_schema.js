var DbSchema          = require( '../db_schema' );
var MysqlTableSchema  = require( './mysql_table_schema' );
var MysqlColumnSchema = require( './mysql_column_schema' );

module.exports = MysqlSchema.inherits( DbSchema );

function MysqlSchema( params ) {
  this._init( params );
}


MysqlSchema.prototype._init = function( params ) {
  this.super_._init( params );
};


MysqlSchema.prototype.quote_table_name = function( name ) {
  return '`' + name + '`';
}


MysqlSchema.prototype.quote_column_name = function( name ) {
  return '`' + name + '`';
}


MysqlSchema.prototype._load_table = function( name, callback ) {
  var table = this._tables[ name ] = new MysqlTableSchema({
    db_schema : this,
    name      : name,
    app       : this.app
  });
  
  table.on( 'initialized', function() {
    callback( null, table );
  } );
}


MysqlSchema.prototype._create_column = function( column ) {
  return new MysqlColumnSchema({
    name           : column['Field'],
    allow_null     : column['Null'] == 'YES',
    is_primary_key : column['Key'].indexOf( 'PRI' ) != -1,
    db_type        : column['Type'],
    default_value  : column['Default'],
    db_schema      : this
  });
}