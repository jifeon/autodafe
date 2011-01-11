var ActiveRecordMetaData = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( ActiveRecordMetaData, process.EventEmitter );


ActiveRecordMetaData.prototype._init = function( params ) {

  this.table_schema       = null;
  this.columns            = {};
  this.relations          = {};
  this.attribute_defaults = {};
  this.initialized        = false

  this.__model            = params.model;

  var table_name  = this.__model.table_name();
  var table       = this.__model.get_db_connection().get_schema().get_table( table_name );

  var self = this;

  if ( table.initialized() ) this.deferred_init( table );
  else table.on( 'initialized', function() {
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

  //todo: relations
//  for ( var name in this.__model.relations ) {
//    var config = this.__model.relations[ name ];
//
//    if( config[0] && config[1] && config[2] )  // relation class, ar class, fk
//      this.relations[name]=new config[0](name,config[1],config[2],array_slice(config,3));
//    else
//      throw new cdb_exception(yii::t('yii','active record "{class}" has an invalid configuration for relation "{relation}". it must specify the relation type, the related active record class and the foreign key.',
//        array('{class}'=>get_class(model),'{relation}'=>name)));
//  }
};
