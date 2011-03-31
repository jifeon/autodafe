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
  return new MysqlTableSchema({
    db_schema : this,
    name      : name
  });
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