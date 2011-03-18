var DB          = require('../db_connection');
var sys         = require('sys');
var mysql       = require('./node-mysql/mysql-libmysqlclient');
var MysqlSchema = require( './mysql_schema' );

var MysqlDBConnection = module.exports = function( config ) {
  this._init( config );
};


require('sys').inherits( MysqlDBConnection, DB );


MysqlDBConnection.prototype._init = function( config ) {
  DB.prototype._init.call( this, config );

  this._schema = new MysqlSchema( {
    connection : this,
    app        : this.app
  } );

  var self = this;

  this.initialized  = false;

 // this.connect();
  this.conn = mysql.createConnectionSync();
  this.conn.connectSync(self.host, self.user, self.pass, self.base);
  if ( !this.conn.connectedSync() ) {
  	this.app.log( "Connection error " + this.conn.connectErrno + ": " + this.conn.connectError );
  	process.exit(1);
	} else {
    this.app.log( "Connection success" );
  }
  this.initialized = true;
  this.query = this.__query;
};

MysqlDBConnection.prototype.query = function ( sql, callback, errback ) {
  var self = this;

  var emitter = new process.EventEmitter;

  this.on( 'initialized', function() {
    self.__query( sql, callback, errback, emitter );
  } );

  return emitter;
};


MysqlDBConnection.prototype.__query = function ( sql, callback, errback, emitter ) {
  var emitter = emitter || new process.EventEmitter;
  
  if ( typeof sql != "string" || !sql.length ) {
    this.app.log( 'Bad sql "%s"'.format( sql ), 'error', 'MysqlDBConnection' );
    return emitter;
  }
  errback  = errback  || this.standard_errback;
  callback = callback || function(){};

  this.app.log( 'Quering sql: ' + sql, 'trace', 'MysqlDBConnection' );
  var db = this;
  this.conn.query( sql, function( err, res) {
    if (err) {
        errback( 'mysql error: ' + err );
    }
    callback.call(db, res);
    emitter.emit( 'response', res, db );
  });
  return emitter;
};


MysqlDBConnection.prototype.standard_errback = function ( message ) {
  this.app.log( message, 'error', 'MysqlDBConnection' );
};


MysqlDBConnection.prototype.fetch_array = function ( res, callback ) {
  //	if ( (res.fieldCountGetter() > 0) || (typeof callback != 'function') ) return false;
  if ( (this.conn.affectedRowsSync() == 0) || (typeof callback != 'function') ) return false;

	while (row = res.fetchArraySync()) {
    	if ( callback.call( this, row ) === false ) break;
	}
};


MysqlDBConnection.prototype.fetch_args = function ( res, callback ) {
//  	if ( (res.fieldCountGetter() > 0) || (typeof callback != 'function') ) return false;
  if ( (this.conn.affectedRowsSync() == 0) || (typeof callback != 'function') ) return false;

	while (row = res.fetchArraySync()) {
    	if ( callback.apply( this, row ) === false ) break;
	}
};


MysqlDBConnection.prototype.fetch_obj = function ( res, callback ) {
  if ( (this.conn.affectedRowsSync() == 0) || (typeof callback != 'function') ) return false;

	while (row = res.fetchArraySync()) {
    var obj = {};
	  for(var i = 0, ln = row.length; i < ln; i++){
	    obj[ res.fetchFieldDirectSync(i).name ] = row[ i ];
	  }
	  if ( callback.call( this, obj ) === false ) break;
	}
};