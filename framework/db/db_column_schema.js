var DBColumnSchema = module.exports = function( params ) {
  this._init( params );
};


DBColumnSchema.prototype._init = function( params ) {
  this.name           = null;
  this.rawName        = null;
  this.allow_null     = null;
  this.db_type        = null;
  this.type           = null;
  this.default_value  = null;
  this.size           = null;
  this.precision      = null;
  this.scale          = null;
  this.is_primary_key = null;
  this.is_foreign_key = null;
};


DBColumnSchema.prototype.deferred_init = function( db_type, default_value ) {
  this.db_type = db_type;

  this._extract_type(  db_type );
  this._extract_limit( db_type );

  if ( default_value !== null ) this._extract_default( default_value );
}


DBColumnSchema.prototype._extract_type = function( db_type ) {
  if ( db_type.toLowerCase().indexOf( 'int' ) != -1 )           this.type = 'integer';
  else if ( db_type.toLowerCase().indexOf( 'bool' ) !== false ) this.type = 'boolean';
  else if ( db_type.search( /(real|floa|doub)/i ) != -1 )       this.type = 'double';
  else                                                          this.type = 'string';
}


DBColumnSchema.prototype._extract_limit = function( db_type ) {
  var matches;

  if (
    ( db_type.indexOf( '(' ) != -1 ) &&
    ( matches = db_type.match( /\((.*)\)/ ) )
  ) {
    var values  = matches[1].split( ',' );
    this.size   = this.precision  = Number( values[0] );
    if ( values[1] ) this.scale   = Number( values[1] );
  }
}


DBColumnSchema.prototype._extract_default = function( default_value ) {
  this.default_value = this.typecast( default_value );
}


DBColumnSchema.prototype.typecast = function( value ) {
  if ( this.__get_type( value ) == this.type || value == null || value instanceof Error ) return value;

  if ( value === '' ) return this.type == 'string' ? '' : null;

  switch ( this.type ) {
    case 'string':  return String( value );
    case 'integer': return Number( value );
    case 'boolean': return Boolean( value );
    case 'double':
    default: return value;
  }
};


DBColumnSchema.prototype.__get_type = function ( value ) {
  var t = typeof value;
  if ( t == 'string' || t == 'boolean' ) return t;
  if ( t == 'number' ) return Math.round( t ) == t ? 'integer' : 'double';
  return t;
};