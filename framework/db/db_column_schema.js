module.exports = DbColumnSchema;

function DbColumnSchema() {
  throw new Error( 'You can\'t instantiate abstract class DbColumnSchema' );
}


DbColumnSchema.prototype._init = function( params ) {
  if ( !params || !params.db_schema ) throw new Error( 'Link to Db schema is undefined in DbColumnSchema.init' );

  this.db_schema      = params.db_schema;
  this.name           = params.name           || null;
  this.allow_null     = params.allow_null     || null;
  this.db_type        = params.db_type        || null;
  this.type           = params.type           || null;
  this.default_value  = params.default_value  || null;
  this.size           = params.size           || null;
  this.precision      = params.precision      || null;
  this.scale          = params.scale          || null;
  this.is_primary_key = params.is_primary_key || null;

  this.raw_name       = this.name ? this.db_schema.quote_column_name( this.name ) : null;

  this._extract_type();
  this._extract_limit();

  if ( this.default_value != null ) this._extract_default();
};


DbColumnSchema.prototype._extract_type = function() {
  if ( !this.db_type ) return this.type = "string";

  if ( this.db_type.toLowerCase().indexOf( 'int' ) != -1 )           this.type = 'integer';
  else if ( this.db_type.toLowerCase().indexOf( 'bool' ) !== false ) this.type = 'boolean';
  else if ( this.db_type.search( /(real|floa|doub)/i ) != -1 )       this.type = 'double';
  else                                                               this.type = 'string';
}


DbColumnSchema.prototype._extract_limit = function() {
  var matches;

  if (
    ( this.db_type.indexOf( '(' ) != -1 ) &&
    ( matches = this.db_type.match( /\((.*)\)/ ) )
  ) {
    var values  = matches[1].split( ',' );
    this.size   = this.precision  = Number( values[0] );
    if ( values[1] ) this.scale   = Number( values[1] );
  }
}


DbColumnSchema.prototype._extract_default = function() {
  this.default_value = this.typecast( this.default_value );
}


DbColumnSchema.prototype.typecast = function( value ) {
  if ( this.__get_type( value ) == this.type || value == null || value instanceof Error ) return value;

  if ( value === '' ) return this.type == 'string' ? '' : null;

  switch ( this.type ) {
    case 'string':  return String( value );
    case 'integer':
      value = Number( value );
      return isNaN( value ) ? null : value;
    case 'boolean': return Boolean( value );
    case 'double':
    default: return value;
  }
};


DbColumnSchema.prototype.__get_type = function ( value ) {
  var t = typeof value;
  if ( t == 'string' || t == 'boolean' ) return t;
  if ( t == 'number' ) return Math.round( t ) == t ? 'integer' : 'double';
  return t;
};