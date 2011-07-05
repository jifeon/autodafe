var AutodafePart = require('autodafe_part');

module.exports = MysqlResult.inherits( AutodafePart );

function MysqlResult( params ) {
  this._init( params );
}


MysqlResult.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params || !params.source ) throw new Error( '`source` is not defined in MysqlResult.init' );
  this._.source     = params.source;
  this._.insert_id  = this.source.insertId;
};


MysqlResult.prototype.get_all_rows = function () {
  return this.source.fetchAllSync();
};


MysqlResult.prototype.get_num_rows = function () {
  return this.source.numRowsSync();
};


MysqlResult.prototype.fetch_array = function ( callback, context ) {
  if ( this.source.numRowsSync() == 0 || typeof callback != 'function' ) return false;

  var row;
  while ( row = this.source.fetchArraySync() ) {
    if ( callback.call( context || null, row ) === false ) break;
  }
};


MysqlResult.prototype.fetch_obj = function ( callback, context ) {
  if ( this.source.numRowsSync() == 0 || typeof callback != 'function' ) return false;

  var row;
  while (row = this.source.fetchArraySync()) {

    var obj = {};
    for (var i = 0, ln = row.length; i < ln; i++) {
      obj[ this.source.fetchFieldDirectSync( i ).name ] = row[ i ];
    }

    if ( callback.call( context || null, obj ) === false) break;
  }
};