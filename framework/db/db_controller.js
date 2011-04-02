var Component         = require('components/component');
var MysqlDBConnection = require('./mysql/mysql_db_connection');

module.exports = DBController.inherits( Component );

function DBController( params ) {
  this._init( params );
}


DBController.prototype._init = function( params ) {
  this.super_._init( params );

  this._db          = null;
  this.__db_config  = params;
};


DBController.prototype.get = function () {
  return this._db ? this._db : this._init_database();
};


DBController.prototype._init_database = function () {
  var db_type = this.__db_config.type;
  delete this.__db_config.type;

  switch ( db_type ) {
    case 'mysql':
      this._db = new MysqlDBConnection( this.__db_config );
      break;

    default :
      this.log( 'You must specify data base type ( db.type ) in your configuration file', 'error' );
      break;
  }

  return this._db;
};