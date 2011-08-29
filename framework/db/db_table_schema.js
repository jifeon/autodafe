var AppModule = require('app_module');
var DbSchema  = require('db/db_schema');

module.exports = DbTableSchema.inherits( AppModule );

function DbTableSchema() {
  throw new TypeError( 'You can\'t instantiate abstract class DbTableSchema' );
}


DbTableSchema.prototype._init = function( params ) {
  this.super_._init( params );

  this._.db_schema = params.db_schema;
  if ( !( this.db_schema instanceof DbSchema ) )
    throw new TypeError( '`sb_schema` in DbTableSchema._init should be instanceof DbSchema' );

  this.name           = null;
  this.raw_name       = null;
  this.primary_key    = null;
  this.in_sequence    = false;
  this.is_inited      = false;
  this.foreign_keys   = {};

  this._._columns     = {};
};


DbTableSchema.prototype.get_column = function( name ) {
  return this._columns[ name ] || null;
};


DbTableSchema.prototype.get_column_names = function() {
  return Object.keys( this._columns );
};


DbTableSchema.prototype.each_primary_key = function ( callback, context ) {
  if ( this.primary_key == null ) return this.log(
    'DbTableSchema.each_primary_key try to use primary_key in table `%s`, but it is null'.format( this.name ),
    'warning'
  );

  var pks = Array.isArray( this.primary_key ) ? this.primary_key : [ this.primary_key ];
  pks.forEach( callback, context );
};


DbTableSchema.prototype.get_number_of_pks = function () {
  return Array.isArray( this.primary_key )
    ? this.primary_key.length
    : this.primary_key
      ? 1
      : 0;
};