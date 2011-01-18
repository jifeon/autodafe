var LogRoute  = require('./log_route');
var path      = require('path');
var fs        = require('fs');

var FileRoute = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( FileRoute, LogRoute );


FileRoute.prototype._init = function( params ) {
  this._log_cache     = [];
  this._log_file_path = path.join( global.autodafe.app.base_dir, 'runtime/autodafe.log' );
  this._max_file_size = 1024;
  this._max_log_files = 5;

  var self = this;
  this._interval_id  = setInterval( function() {
    self.process_logs();
  }, 1000 );

  LogRoute.prototype._init.call( this, params );
};


FileRoute.prototype.on_log = function ( message ) {
  this._log_cache.push( this._format( message ) );
};


FileRoute.prototype.process_logs = function () {

  if ( !this._log_cache.length ) return false;

  var file_emitter = new process.EventEmitter;
  var self    = this;

  path.exists( this._log_file_path, function( exists ) {

    if ( exists ) {
      fs.stat( self._log_file_path, function( e, stats ) {
        if ( e ) return self.logger.log( e.message, 'error', 'FileRoute' );
        if ( stats.size > self._max_file_size * 1024 ) self._rotate_files( self._max_log_files, file_emitter );
      } );
    }
    else file_emitter.emit( 'ready_to_write' );

  });

  file_emitter.on( 'ready_to_write', function() {
//    fs.open( self._log_file_path, 'a', 0666, function( e, fd ) {
//
//      if ( e ) return self.logger.log( e.message, 'error', 'FileRoute' );
//
//      this._log_cache.push('');
//      fs.write( fd, this._log_cache.join( "\n" ), null, function( e, written ) {
//        fs.close( fd );
//        if ( e ) return self.logger.log( e.message, 'error', 'FileRoute' );
//      } );
//
//      this._log_cache = [];
//    } );


    self._log_cache.push('');
    fs.writeFile( self._log_file_path, self._log_cache.join( "\n" ), 'utf8', function( e ) {
      if ( e ) return self.logger.log( e.message, 'error', 'FileRoute' );
    } );

    self._log_cache = [];
  } );
};


FileRoute.prototype._rotate_files = function ( f, file_emitter ) {
  if ( f < 0 ) return file_emitter.emit( 'ready_to_write' );

  var self        = this;
  var rotate_file = this._log_file_path + ( f ? '.' + f : '' );

  path.exists( rotate_file, function( exists ) {
    if ( !exists ) return self._rotate_files( f - 1, file_emitter );

    if ( f == self._max_log_files ) fs.unlink( rotate_file, function() {
      self._rotate_files( f - 1, file_emitter );
    } );
    else fs.rename( rotate_file, self._log_file_path + '.' + ( f + 1 ), function() {
      self._rotate_files( f - 1, file_emitter );
    } );
  } );


};