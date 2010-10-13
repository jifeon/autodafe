var DBTableSchema = require( '../db_table_schema' );

var MysqlTableSchema = module.exports = function( params ) {
  this._init( params );
};


require( 'sys' ).inherits( MysqlTableSchema, DBTableSchema );


MysqlTableSchema.prototype._init = function( params ) {
  DBTableSchema.prototype._init.call( this, params );

  /**
   * @var string name of the schema (database) that this table belongs to.
   * Defaults to null, meaning no schema (or the current database).
   */
  this.schema_name = null;

  this._initialized   = {
    all           : false,
    params        : {
      columns       : false,
      foreign_keys  : false
    },
    count         : 0,
    all_count     : 2
  };

  this.on( 'initialized', function() {
    console.log( 'Table ' + this.name + ' initialized');
  } );
};


MysqlTableSchema.prototype.init_param = function ( param ) {
  var i = this._initialized;
  if ( i.params[ param ] == undefined ) return false;

  i.params[ param ] = true;
  this.emit( 'initialized_param', param );

  i.count++;
  if ( i.count == i.all_count ) {
    i.all = true;
    this.emit( 'initialized' );
  }
};


MysqlTableSchema.prototype.initialized = function ( param ) {
  return param ? this._initialized.params[ param ] : this._initialized.all;
};