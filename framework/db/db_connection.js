var AppModule   = require('app_module');
var DbCommand   = require( './db_command' );

module.exports = DbConnection.inherits( AppModule );

function DbConnection() {
  throw new TypeError( 'DbConnection is abstract class. You can\'t instantiate it!' );
}


DbConnection.prototype._init = function( params ) {
  this.super_._init( params );

  this._.user     = params.user     || 'root';
  this._.pass     = params.pass     || '';
  this._.base     = params.base     || 'test';
  this._.host     = params.host     || 'localhost';
  this._.encoding = params.encoding || 'utf8';

  this.db_schema  = null;
};


DbConnection.prototype.create_command = function( sql ) {
  return new DbCommand({
    db_connection : this,
    text          : sql,
    app           : this.app
  });
};


DbConnection.prototype.query = function ( sql, callback ) {
  throw new Error( 'You should implement method `query` in inherited classes' );
};


DbConnection.prototype.quote_value = function ( x ) {
  switch ( typeof x ) {
    case 'string':
      return "'" + this.escape_sql_str( x ) + "'";

    case 'number':
      return x.toString();

    case 'object':
      if ( x == null )
        return 'NULL';

      else if ( x instanceof Date )
        return x.format( "'Y-M-D h:m:s'" );

      else {
        this.log( 'Unknown type of `object`. Trying `toString` method', 'warning' );
        return this.quote_value( x.toString() );
      }

    case 'boolean':
      return Number( !!x ).toString();

    case 'undefined':
      return "''";

    default:
      throw new Error( 'DbConnection.quote_value: unknown type: ' + typeof x );
  }
};


DbConnection.prototype.escape_sql_str = function( str ) {
  // Backslash-escape single quotes, double quotes and backslash. Morph 0x00 into \0.
  return str.replace( /(['"\\])/g, '\\$1' ).replace( /\x00/g, '\\0' );
}