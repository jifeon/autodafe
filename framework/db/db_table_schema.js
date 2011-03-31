var AppModule       = require('app_module');

module.exports = DBTableSchema.inherits( AppModule );

function DBTableSchema() {
  throw new Error( 'You can\'t instantiate abstract class DBTableSchema' );
}


DBTableSchema.prototype._init = function( params ) {
  this.super_._init( params );
  
  if ( !params.db_schema ) throw new Error( 'Link to DB schema is undefined in DBTableSchema.init' );

  this.db_schema      = params.db_schema;
  this.name           = null;
  this.raw_name       = null;
  this.primary_key    = null;
  this.sequence_name  = null;
  this.columns        = {};
};


DBTableSchema.prototype.get_column = function( name ) {
  return this.columns[ name ] ? this.columns[ name ] : null;
};


DBTableSchema.prototype.get_column_names = function() {
  return Object.keys( this.columns );
};


