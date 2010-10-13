var MysqlSchema = require( './mysql/mysql_schema' );
var DBCommand   = require( './db_command' );

var DBConnection = module.exports = function( config ) {
  this._init( config );
};


require( 'sys' ).inherits( DBConnection, process.EventEmitter );


DBConnection.prototype._init = function( config ) {
  this._config = config || {};

  this.user = this._config.user || 'root';
  this.pass = this._config.pass || '';
  this.base = this._config.base || 'test';
  this.host = this._config.host || 'localhost';

  this.table_prefix = null;

  this._schema = new MysqlSchema( {
    connection : this
  } );
};

/**
 * Creates a command for execution.
 * @param string SQL statement associated with the new command.
 * @return DbCommand the DB command
 * @throws Exception if the connection is not active
 */
DBConnection.prototype.create_command = function( sql ) {
  return new DBCommand({
    connection  : this,
    text        : sql
  });
};

DBConnection.prototype.get_schema = function () {
  return this._schema;
};


DBConnection.prototype.quote_value = function ( x ) {
  switch ( typeof x ) {
    case 'string':
      return "'" + this.__add_slashes( x ) + "'";

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
        throw new Error( 'DBCommand.sqlstr: unsupported type "object"' );
      }

    case 'boolean':
      return x === true ? '1' : '0';

    default:
      throw new Error( 'DBConnection.quote_value: unknown type: ' + typeof x );
  }
};


DBConnection.prototype.__add_slashes = function( str ) {
  // Backslash-escape single quotes, double quotes and backslash. Morph 0x00 into \0.
  return str.replace( /(['"\\])/g, '\\$1' ).replace( /\x00/g, '\\0' );
}