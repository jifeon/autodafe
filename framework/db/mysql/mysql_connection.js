var DbConnection  = require('../db_connection');
var MysqlSchema   = require('./mysql_schema');
var MysqlResult   = require('./mysql_result');
var Mysql         = require('mysql');

module.exports = MysqlConnection.inherits( DbConnection );

function MysqlConnection( params ) {
  this._init( params );
}


MysqlConnection.prototype._init = function( params ) {
  this.super_._init( params );
  this.setMaxListeners( 100 );

  this._.db_schema = new MysqlSchema({
    db_connection : this,
    app           : this.app
  });

  delete params.app;
  this._connection = this.get_new_connection( params );

  var self = this;
  this.__query( 'SET NAMES "' + this.encoding + '"', function( e ){
    if ( e ) throw e;

    self.__query( 'set character_set_connection=' + self.encoding, function( e ){
      if ( e ) throw e;

      self.__query( 'set names ' + self.encoding, function( e ){
        if ( e ) throw e;

        self.log( 'Connection success', 'info' );
        self.emit( 'connect' );
      } );
    } );
  } );

  this.on( 'connect', function() {
    this.query = this.__query;
  });
};


MysqlConnection.prototype.get_new_connection = function ( params ) {
  return Mysql.createClient( params );
};


MysqlConnection.prototype.query = function ( sql, callback ) {
  var self = this;

  this.on( 'connect', function() {
    self.__query( sql, callback );
  });
};


MysqlConnection.prototype.__query = function ( sql, callback ) {
  callback = callback || this.app.default_callback;
  if ( typeof sql != "string" || !sql.length ) return callback( 'Bad sql: ' + sql );

  this.log( 'Querying sql: ' + sql );
  return this._connection.query( sql, function( e, res, fields ) {
    if ( e ) return callback( e );

    callback( null, new MysqlResult( {
      result:res,
      fields:fields
    } ) );
  } );
};
