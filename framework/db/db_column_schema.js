var AppModule = global.autodafe.AppModule;

module.exports = DbColumnSchema.inherits( AppModule );

function DbColumnSchema() {
  throw new Error( 'You can\'t instantiate abstract class DbColumnSchema' );
}


DbColumnSchema.prototype._init = function( params ) {
  DbColumnSchema.parent._init.call( this, params );

  if ( !params || !params.db_schema ) throw new Error( 'Link to Db schema is undefined in DbColumnSchema.init' );

  this._.db_schema      = params.db_schema;
  this._.allow_null     = params.allow_null     || null;

  this._.db_type        = params.db_type        || null;
  this._.type           = this._extract_type();
  this._.default_value  = this._extract_default( params.default_value );

  this.size             = null;
  this.precision        = null;
  this.scale            = null;
  this._extract_limit();

  this._.is_primary_key = params.is_primary_key || false;
  this._.name           = params.name           || '';
  this._.raw_name       = this.name ? this.db_schema.quote_column_name( this.name ) : null;
};


DbColumnSchema.prototype._extract_type = function() {
  if ( !this.db_type ) return "string";

  if ( this.db_type.toLowerCase().indexOf( 'int' ) != -1 )      return 'integer';
  if ( this.db_type.toLowerCase().indexOf( 'bool' ) !== false ) return 'boolean';
  if ( this.db_type.search( /(real|floa|doub)/i ) != -1 )       return 'double';

  return 'string';
}


DbColumnSchema.prototype._extract_limit = function() {
  var matches;

  if (
    ( this.db_type.indexOf( '(' ) != -1 ) &&
    ( matches = this.db_type.match( /\((.*)\)/ ) )
  ) {
    var values  = matches[1].split( ',' );
    this._.size = this._.precision = Number( values[0] );
    if ( values[1] ) this._.scale  = Number( values[1] );
  }
}


DbColumnSchema.prototype._extract_default = function( default_value ) {
  return default_value ? this.typecast( default_value ) : null;
}


DbColumnSchema.prototype.typecast = function( value ) {
  if ( this.__get_type( value ) == this.type || value == null || value instanceof Error || value instanceof Date )
    return value;

  if ( !value ) return this.type == 'string' ? '' : null;

  switch ( this.type ) {
    case 'string':  return String( value );
    case 'integer':
      value = Number( value );
      return isNaN( value ) ? null : value;
    case 'boolean': return !!value;
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