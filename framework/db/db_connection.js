var DbCommand   = require( './db_command' );
var AppModule       = require('app_module');

module.exports = DbConnection.inherits( AppModule );

function DbConnection() {
  throw new Error( 'DbConnection is abstract class. You can\'t instantiate it!' );
}


DbConnection.prototype._init = function( params ) {
  this.super_._init( params );

  this.user = params.user || 'root';
  this.pass = params.pass || '';
  this.base = params.base || 'test';
  this.host = params.host || 'localhost';

//  this.table_prefix = null;

  this._schema = null;
};

/**
 * Creates a command for execution.
 * @param string SQL statement associated with the new command.
 * @return DbCommand the Db command
 * @throws Exception if the connection is not active
 */
DbConnection.prototype.create_command = function( sql ) {
  return new DbCommand({
    connection  : this,
    text        : sql
  });
};

DbConnection.prototype.get_schema = function () {
  return this._schema;
};


DbConnection.prototype.quote_value = function ( x ) {
  switch ( typeof x ) {
    case 'string':
      return "'" + this.escape_sql_str( x ) + "'";

    case 'number':
      return x.toString();

    case 'object':
      if ( x === null ) {
        return 'NULL';
      }
      else if ( x.constructor === Date ) {
        return "'"
          + x.getFullYear()
          + '-'
          + ( x.getMonth() + 1 )
          + '-'
          + x.getDate()
          + ' '
          + x.getHours()
          + ':'
          + x.getMinutes()
          + ':'
          + x.getSeconds()
          + "'";
      }
      else {
        throw new Error( 'DbCommand.sqlstr: unsupported type "object"' );
      }

    case 'boolean':
      return x === true ? '1' : '0';

    default:
      throw new Error( 'DbConnection.quote_value: unknown type: ' + typeof x );
  }
};


DbConnection.prototype.escape_sql_str = function( str ) {
  // Backslash-escape single quotes, double quotes and backslash. Morph 0x00 into \0.
  return str.replace( /(['"\\])/g, '\\$1' ).replace( /\x00/g, '\\0' );
}