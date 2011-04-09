var Db = require('../db_connection');
var sys = require('sys');
var mysql = require('./node-mysql/mysql-libmysqlclient');
var MysqlSchema = require('./mysql_schema');

module.exports = MysqlConnection.inherits( Db );

function MysqlConnection( params ) {
  this._init( params );
}


MysqlConnection.prototype._init = function(params) {
  this.super_._init( params );

  this._.db_schema = new MysqlSchema({
    db_connection : this,
    app           : this.app
  });

  var self = this;

  this.initialized = false;

  // this.connect();
  this.conn = mysql.createConnectionSync();
  this.conn.connectSync(self.host, self.user, self.pass, self.base);
  if (!this.conn.connectedSync()) {
    throw new Error( 'Connection error ( %s ): %s '.format( this.conn.connectErrno, this.conn.connectError ) );
  }
  else {
    this.log( 'Connection success', 'info' );
  }
  this.initialized = true;
  this.query = this.__query;
};

MysqlConnection.prototype.query = function (sql, callback, errback) {
  var self = this;

  var emitter = new process.EventEmitter;

  this.on('initialized', function() {
    self.__query(sql, callback, errback, emitter);
  });

  return emitter;
};


MysqlConnection.prototype.__query = function (sql, callback, errback, emitter) {
  emitter = emitter || new process.EventEmitter;

  if (typeof sql != "string" || !sql.length) {
    this.log( 'Bad sql "%s"'.format( sql ), 'error' );
    return emitter;
  }

  var self = this;
  errback = errback || function() {
    self.standard_errback();
  }
  callback = callback || function() {};

  this.log( 'Quering sql: ' + sql, 'trace', 'MysqlConnection');
  var db = this;
  this.conn.query(sql, function(err, res) {
    if (err) {
      errback('mysql error: ' + err);
    }
    callback.call(db, res);
    emitter.emit('response', res, db);
  });
  return emitter;
};


MysqlConnection.prototype.standard_errback = function (message) {
  this.log( message, 'error' );
};


MysqlConnection.prototype.fetch_array = function (res, callback) {
  //	if ( (res.fieldCountGetter() > 0) || (typeof callback != 'function') ) return false;
    if ((res.numRowsSync() == 0) || (typeof callback != 'function')) return false;

  var row;
  while (row = res.fetchArraySync()) {
    if (callback.call(this, row) === false) break;
  }
};


MysqlConnection.prototype.fetch_args = function (res, callback) {
//  	if ( (res.fieldCountGetter() > 0) || (typeof callback != 'function') ) return false;
    if ((res.numRowsSync() == 0) || (typeof callback != 'function')) return false;

  var row;
  while (row = res.fetchArraySync()) {
    if (callback.apply(this, row) === false) break;
  }
};


MysqlConnection.prototype.fetch_obj = function (res, callback) {
  if ((res.numRowsSync() == 0) || (typeof callback != 'function')) return false;
  var row;
  while (row = res.fetchArraySync()) {
    var obj = {};
    for (var i = 0, ln = row.length; i < ln; i++) {
      obj[ res.fetchFieldDirectSync(i).name ] = row[ i ];
    }
    if (callback.call(this, obj) === false) break;
  }
};
