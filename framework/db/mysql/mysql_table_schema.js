var DBTableSchema = require( '../db_table_schema' );

var MysqlTableSchema = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( MysqlTableSchema, DBTableSchema );


MysqlTableSchema.prototype._init = function( params ) {
  DBTableSchema.prototype._init.call( this, params );

  this.schema_name  = null;

  this._initialized = false;

  var self = this;
  this.on( 'initialized', function() {
    self.app.log( 'Table "%s" initialized'.format( this.name ), 'tarce', 'MysqlTableSchema' );
  } );
};


MysqlTableSchema.prototype.set_initialized = function () {
  this._initialized = true;
  this.emit( 'initialized' );
};


MysqlTableSchema.prototype.is_initialized = function () {
  return this._initialized;
};