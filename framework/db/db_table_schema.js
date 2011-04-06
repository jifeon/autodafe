var AppModule = require('app_module');

module.exports = DbTableSchema.inherits( AppModule );

function DbTableSchema() {
  throw new TypeError( 'You can\'t instantiate abstract class DbTableSchema' );
}


var __ide_hack__ = {
  db_schema : 1
}


DbTableSchema.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.db_schema ) throw new TypeError( 'Link to Db schema is not defined in DbTableSchema.init' );
  Object.defineProperty( this, 'db_schema', {
    value : params.db_schema
  } );

  this.name           = null;
  this.raw_name       = null;
  this.primary_key    = null;
  this.in_sequence    = false;

  this._columns       = {};
};


DbTableSchema.prototype.get_column = function( name ) {
  return this._columns[ name ] || null;
};


DbTableSchema.prototype.get_column_names = function() {
  return Object.keys( this._columns );
};


