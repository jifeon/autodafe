var DbConnection  = require('../db_connection');
var MysqlSchema   = require('./mysql_schema');
var MysqlResult   = require('./mysql_result');

module.exports = MysqlConnection.inherits( DbConnection );

function MysqlConnection( params ) {
  this._init( params );
}


MysqlConnection.prototype._init = function(params) {
  this.super_._init( params );

  this._.db_schema = new MysqlSchema({
    db_connection : this,
    app           : this.app
  });

  var mysql_client    = require('mysql-libmysqlclient');
  this._._connection  = mysql_client.createConnectionSync();

  var self = this;
  this._connection.connect( this.host, this.user, this.pass, this.base, function( e ) {
    if ( e ) throw e;

    self.__query( 'SET NAMES "' + self.encoding + '"', function( e ){
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
  } );

  this.on( 'connect', function() {
    this.query = this.__query;
  });
};


MysqlConnection.prototype.query = function ( sql, callback ) {
  var self = this;

  this.on( 'connect', function() {
    self.__query( sql, callback );
  });
};


MysqlConnection.prototype.__query = function ( sql, callback ) {

  callback = callback || function( e ) { if ( e ) throw e; };
  if ( typeof sql != "string" || !sql.length ) return callback( 'Bad sql: ' + sql );

  this.log( 'Querying sql: ' + sql );
  this._connection.query( sql, function( e, res ) {
    if ( e ) return callback( e );

    callback( null, new MysqlResult({
      source : res
    }) );
  } );
};
