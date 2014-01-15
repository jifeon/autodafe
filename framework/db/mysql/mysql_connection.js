var DbConnection  = require('../db_connection');
var MysqlSchema   = require('./mysql_schema');
var MysqlResult   = require('./mysql_result');
var Mysql         = require('mysql');

module.exports = MysqlConnection.inherits( DbConnection );

function MysqlConnection( params ) {
  this._init( params );
}


MysqlConnection.prototype._init = function( params ) {
  MysqlConnection.parent._init.call( this, params );
  this.setMaxListeners( 100 );

  this._.db_schema = new MysqlSchema({
    db_connection : this,
    app           : this.app
  });

  delete params.app;
  this._connection    = this.get_new_connection( params );

  this._connection.on( 'error', this.app.log.bind( this.app ) );

  this._ping_interval = null;
  this._ping_every    = 60000;

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

  this.app.on( 'stop', function(){
    clearInterval( self._ping_interval );
    self._connection.end(function(e){
      if (e) self.app.log( e );
    })
  });
};


MysqlConnection.prototype.get_new_connection = function ( params ) {
  return Mysql.createConnection( params );
};


MysqlConnection.prototype.query = function ( sql, callback ) {
  var self = this;

  this.on( 'connect', function() {
    self.__query( sql, callback );
  });
};


MysqlConnection.prototype.__query = function ( sql, callback ) {
  if ( this._ping_interval ) {
    clearInterval( this._ping_interval );
  }
  this._ping_interval = setInterval( this._ping.bind( this ), this._ping_every );

  callback = callback || this.app.default_callback;
  if ( typeof sql != "string" || !sql.length )
    return callback( new Error( 'Bad sql: `%s`'.format( sql )));

  this.log( 'Querying sql: ' + sql );
  return this._connection.query( sql, function( e, res, fields ) {
    if ( e ) return callback( e );

    callback( null, new MysqlResult( {
      result:res,
      fields:fields
    } ) );
  } );
};


MysqlConnection.prototype._ping = function () {
  var self = this;
  this._connection.ping( function( e, r ){
    if ( e ) {
      self.log( e );
      clearInterval( self._ping_interval );
    }
  } );
};