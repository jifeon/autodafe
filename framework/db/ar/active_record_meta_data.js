module.exports = ActiveRecordMetaData.inherits( process.EventEmitter );

function ActiveRecordMetaData( params ) {
  this._init( params );
}


ActiveRecordMetaData.prototype._init = function( params ) {

  this.table_schema       = null;
  this.columns            = {};
  this.relations          = {};
  this.attribute_defaults = {};
  this.initialized        = false

  this.__model            = params.model;

  var table_name  = this.__model.table_name();

  var self = this;
  this.__model.get_db_connection().get_schema().get_table( table_name, function( e, table ) {
    if ( e ) throw e;

    self.deferred_init( table );
  } );
};


ActiveRecordMetaData.prototype.deferred_init = function ( table ) {
  if( table.primary_key == null ) table.primary_key = this.__model.primary_key();

  this.table_schema = table;
  this.columns      = table.columns;

  for ( var name in table.columns ) {
    var column = table.columns[ name ];
    if( !column.is_primary_key && column.default_value != null )
      this.attribute_defaults[ name ] = column.default_value;
  }

  this.initialized = true;
  this.emit( 'initialized' );
};
