var DBColumnSchema = require('../db_column_schema');

var MysqlColumnSchema = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( MysqlColumnSchema, DBColumnSchema );


MysqlColumnSchema.prototype._extract_type = function() {
  if ( this.db_type.substr( 0, 4 ) == 'enum' )                       this.type = 'string';
  else if ( this.db_type.search( /(bigint|float|double)/ ) != -1 )   this.type = 'double';
  else if ( this.db_type.indexOf( 'bool' ) != -1 )                   this.type = 'boolean';
  else if ( this.db_type.search( /(int|bit)/ ) != -1 )               this.type = 'integer';
  else                                                               this.type = 'string';
}

MysqlColumnSchema.prototype._extract_default = function() {
  if ( this.db_type === 'timestamp' && this.default_value === 'current_timestamp' )
    this.default_value = null;
  else
    DBColumnSchema.prototype._extract_default.call( this );
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

    this.size = this.precision = size - 2;
  }
  else DBColumnSchema.prototype._extract_limit.call( this );
};