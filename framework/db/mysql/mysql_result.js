var AutodafePart = global.autodafe.AutodafePart;

module.exports = MysqlResult.inherits( AutodafePart );

function MysqlResult( params ) {
  this._init( params );
}


MysqlResult.prototype._init = function( params ) {
  this.super_._init( params );

  this.result     = params.result;
  this.fields     = params.fields;
  this.insert_id  = this.result.insertId;
};


MysqlResult.prototype.get_all_rows = function () {
  return this.result;
};


MysqlResult.prototype.get_num_rows = function () {
  return Array.isArray( this.result ) ? this.result.length : 0;
};


MysqlResult.prototype.fetch_array = function ( callback, context ) {
  if ( !this.get_num_rows() || typeof callback != 'function' ) return false;

  this.result.every( function( row ){
    return callback.call( context || null, Object.values( row ) ) !== false;
  } );
};


MysqlResult.prototype.fetch_obj = function ( callback, context ) {
  if ( this.get_num_rows() == 0 || typeof callback != 'function' ) return false;

  this.result.every( function( row ){
    return callback.call( context || null, row ) !== false;
  } );
};