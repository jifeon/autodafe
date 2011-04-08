var DbColumnSchema = require('../db_column_schema');

module.exports = MysqlColumnSchema.inherits( DbColumnSchema );

function MysqlColumnSchema( params ) {
  this._init( params );
}


MysqlColumnSchema.prototype._extract_type = function() {
  if ( this.db_type.substr( 0, 4 ) == 'enum' )                  return 'string';
  if ( this.db_type.search( /(bigint|float|double)/ ) != -1 )   return 'double';
  if ( this.db_type.indexOf( 'bool' ) != -1 )                   return 'boolean';
  if ( this.db_type.search( /(int|bit)/ ) != -1 )               return 'integer';

  return 'string';
}

MysqlColumnSchema.prototype._extract_default = function( default_value ) {
  if ( this.db_type == 'timestamp' && default_value == 'current_timestamp' ) return null;
  else return this.super_._extract_default();
};


MysqlColumnSchema.prototype._extract_limit = function() {
  var matches;

  if (
    ( this.db_type.substr( 0, 4 ) == 'enum' ) &&
    ( matches = this.db_type.match( /\((.*)\)/ ) )
  ) {
    var values  = matches[1].split( ',' );
    var size    = 0;

    for ( var v = 0, v_ln = values.length; v < v_ln; v++ ) {
      var n = values[v].length;
      if ( n > size ) size = n;
    }

    this._.size = this._.precision = size - 2;
  }
  else this.super_._extract_limit();
};