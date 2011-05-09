module.exports = ProtectedValuesDescriptor;

function ProtectedValuesDescriptor( params ) {
  this._init( params );
}


ProtectedValuesDescriptor.prototype._init = function( params ) {
  if ( !Object.isObject( params ) || !params.name || !params.target )
    throw new Error( '`name` and `target` are required in ProtectedValuesDescriptor._init' );

  this.name   = params.name;
  this.target = params.target;
  this.value  = params.value;

  if ( typeof params.get == "function" ) this.get = params.get;
  if ( typeof params.set == "function" ) this.set = params.set;
};


ProtectedValuesDescriptor.prototype.get = function() {
  return this.value;
}


ProtectedValuesDescriptor.prototype.set = function( value ) {
  throw new TypeError( 'Property `%s` of `%s` is read only'.format( this.name, this.target.class_name ) );
}


ProtectedValuesDescriptor.prototype['delete'] = function () {
  this.reset( true );
  this.value = undefined;

  return true;
};


ProtectedValuesDescriptor.prototype._default_set = function ( value ) {
  this.value = value;
};


ProtectedValuesDescriptor.prototype.reset = function ( default_set ) {
  this.get = this.constructor.prototype.get;
  this.set = default_set ? this._default_set : this.constructor.prototype.set;
};