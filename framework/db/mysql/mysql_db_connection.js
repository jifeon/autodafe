var DB        = require('../db_connection');
var sys       = require('sys');
var http      = require('http');

var MysqlDBConnection = module.exports = function( config, app ) {
  this._init( config, app );
};


require('sys').inherits( MysqlDBConnection, DB );


MysqlDBConnection.prototype._init = function( config, app ) {
  DB.prototype._init.call( this, config, app );

  this.initialized  = false;

  this.connect();
};


MysqlDBConnection.prototype.connect = function () {
  var self = this;

  this.on( 'initialized', function() {
    self.on_initialized();
  } );

  this.run_dbslayer();
};


MysqlDBConnection.prototype.select_db = function () {
  var self = this;

  this.app.log( 'dbslayer is runned successfully', 'info', 'MysqlDBConnection' );
  this.__query( 'use ' + this.base,
    function( result ) {
      self.app.log( 'Connection to base "%s" is initialized'.format( self.base ), 'info', 'MysqlDBConnection' );
      self.emit( 'initialized' );
    },
    function( error ){
      self.app.log( 'Connection to base "%s" isn\'t initialized'.format( self.base ), 'error', 'MysqlDBConnection' );
      self.standard_errback( error );
    }
  );
};


MysqlDBConnection.prototype.run_dbslayer = function () {
  var sys           = require('sys'),
      exec          = require('child_process').exec;

  var self = this;

  exec( 'pkill dbslayer', function( error ) {
    if ( error !== null ) self.app.log( 'pkill dbslayer: ' + error, 'error', 'MysqlDBConnection' );

    self.app.log( 'Running dbslayer..', 'trace', 'MysqlDBConnection' );

    var dbslayer_error = false;
    exec(
      'dbslayer -c %s/dbslayer.conf -s serv -u %s -x %s'.format( __dirname, self.user, self.pass ),
      function ( error, stdout, stderr ) {
        if ( error !== null ) return self.app.log( 'dbslayer: ' + error, 'error', 'MysqlDBConnection' );

        if ( stdout ) self.app.log( 'dbslayer stdout: ' + stdout, 'trace', 'MysqlDBConnection' );
        if ( stderr ) {
          dbslayer_error = true;
          self.app.log( 'dbslayer stderr: ' + stderr, 'error', 'MysqlDBConnection' );
        }
      }
    );

    setTimeout( function(){
      if ( !dbslayer_error ) self.select_db();
    }, 1000);
  } );

};


MysqlDBConnection.prototype.on_initialized = function () {
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
  emitter = emitter || new process.EventEmitter;

  if ( typeof sql != "string" || !sql.length ) {
    this.app.log( 'Bad sql "%s"'.format( sql ), 'error', 'MysqlDBConnection' );
    return emitter;
  }

  var self = this;
  errback  = errback  || function() {
    self.standard_errback();
  };
  callback = callback || function(){};

  this.app.log( 'Quering sql: ' + sql, 'trace', 'MysqlDBConnection' );

  var dbslayer_config = this._config.dbslayer   || {};
  var port            = dbslayer_config.port    || 9090;
  var host            = dbslayer_config.host    || 'localhost';

  var query_string    = escape(JSON.stringify({ SQL : sql }));

  var connection  = http.createClient( port, host );
  var request     = connection.request( 'GET', '/db?' + query_string, { 'host' : this.host } );
  var db          = this;

  request.addListener( 'response', function( response ) {
    var all_data = "";

    response.setEncoding('utf8');
    response.addListener('data', function(data) {
      all_data += data;
    });

    response.addListener('end', function() {
      try {
        var object = JSON.parse( all_data );
      } catch( e ) {
        errback( e.message );
      }

      if ( object !== undefined ) {

        if ( object.MYSQL_ERROR !== undefined ) {
          errback( 'mysql error: ( No. ' + object.MYSQL_ERRNO + ' ): ' + object.MYSQL_ERROR );
        }
        else if ( object.ERROR !== undefined )
          errback( 'error: ' + object.ERROR );

        else {
          var result = object.RESULT ? object.RESULT : object;
          callback.call( db, result );
          emitter.emit( 'response', result, db );
        }
      }
    });
  } );

  request.end();
  return emitter;
};


MysqlDBConnection.prototype.standard_errback = function ( message ) {
  this.app.log( message, 'error', 'MysqlDBConnection' );
};


MysqlDBConnection.prototype.fetch_array = function ( res, callback ) {
  if ( !res.ROWS || typeof callback != 'function' ) return false;

  for ( var r = 0, r_ln = res.ROWS.length; r < r_ln; r++ ) {
    var row = res.ROWS[ r ];
    if ( callback.call( this, row ) === false ) break;
  }
};


MysqlDBConnection.prototype.fetch_args = function ( res, callback ) {
  if ( !res.ROWS || typeof callback != 'function' ) return false;

  for ( var r = 0, r_ln = res.ROWS.length; r < r_ln; r++ ) {
    var row = res.ROWS[ r ];
    if ( callback.apply( this, row ) === false ) break;
  }
};


MysqlDBConnection.prototype.fetch_obj = function ( res, callback ) {
  if ( !res.ROWS || typeof callback != 'function' ) return false;
  for ( var r = 0, r_ln = res.ROWS.length; r < r_ln; r++ ) {
    var row = res.ROWS[ r ];

    var obj = {};
    for ( var h = 0, h_ln = res.HEADER.length; h < h_ln; h++ ) {
      obj[ res.HEADER[ h ] ] = row[ h ];
    }

    if ( callback.call( this, obj ) === false ) break;
  }
};