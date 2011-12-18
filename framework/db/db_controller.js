var Component       = global.autodafe.Component;
var MysqlConnection = require('./mysql/mysql_connection');

module.exports = DbController.inherits( Component );

function DbController( params ) {
  this._init( params );
}


DbController.prototype._init = function( params ) {
  DbController.parent._init.call( this, params );

  this._db          = null;
  this.__db_config  = params;
};


DbController.prototype.get = function () {
  return this._db ? this._db : this._init_database();
};


DbController.prototype._init_database = function () {
  var db_type = this.__db_config.type;
  delete this.__db_config.type;

  this.__db_config.app = this.app;

  switch ( db_type ) {
    case 'mysql':
      this._db = new MysqlConnection( this.__db_config );
      break;

    default :
      this.log( 'You must specify data base type ( db.type ) in your configuration file', 'error' );
      break;
  }

  return this._db;
};