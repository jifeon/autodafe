var DBTableSchema = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( DBTableSchema, process.EventEmitter );


DBTableSchema.prototype._init = function( params ) {
  if ( !params.app ) throw new Error( 'Link to application is undefined in DBTableSchema.init' );

  this.__defineGetter__( 'app', function() {
    return params.app;
  } );

  this.name           = null;
  this.rawName        = null;
  this.primary_key    = null;
  this.sequence_name  = null;
  this.foreign_keys   = [];
  this.columns        = {};
};


DBTableSchema.prototype.get_column = function( name ) {
  return this.columns[ name ] ? this.columns[ name ] : null;
};


DBTableSchema.prototype.get_column_names = function() {
  var names = [];

  for ( var name in this.columns ) {
    names.push( name );
  }
  
  return names;
};


