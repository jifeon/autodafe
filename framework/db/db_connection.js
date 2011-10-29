var AppModule   = require('app_module');
var DbCommand   = require( './db_command' );

module.exports = DbConnection.inherits( AppModule );

function DbConnection() {
  throw new TypeError( 'DbConnection is abstract class. You can\'t instantiate it!' );
}


DbConnection.prototype._init = function( params ) {
  this.super_._init( params );

  this._.user     = params.user     || 'root';
  this._.password = params.password || '';
  this._.database = params.database || 'test';
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
        return "'" + x.toISOString() + "'";

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
  return str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0":    return "\\0";
      case "\n":    return "\\n";
      case "\r":    return "\\r";
      case "\b":    return "\\b";
      case "\t":    return "\\t";
      case "\x1a":  return "\\Z";
      default:      return "\\"+s;
    }
  });
}