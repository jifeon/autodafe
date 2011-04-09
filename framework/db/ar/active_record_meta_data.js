module.exports = ActiveRecordMetaData.inherits( process.EventEmitter );

function ActiveRecordMetaData( params ) {
  this._init( params );
}


ActiveRecordMetaData.prototype._init = function( params ) {

  this.table_schema       = null;
  this.relations          = {};
  this.attribute_defaults = {};
  this.initialized        = false

  this.__model            = params.model;

  var table_name  = this.__model.table_name();

  var self = this;
  this.__model.get_db_connection().db_schema.get_table( table_name, function( e, table ) {
    if ( e ) throw e;

    self.deferred_init( table );
  } );
};


ActiveRecordMetaData.prototype.deferred_init = function ( table ) {
  if( table.primary_key == null ) table.primary_key = this.__model.primary_key();

  this.table_schema = table;

  table.get_column_names().forEach( function( name ) {
    var column = table.get_column( name );
    if( !column.is_primary_key && column.default_value != null )
      this.attribute_defaults[ name ] = column.default_value;
  }, this );

  this.initialized = true;
  this.emit( 'initialized' );
};
