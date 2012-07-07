var LogRoute  = require('./log_route');
var path      = require('path');
var fs        = require('fs');

module.exports = FileLogRoute.inherits( LogRoute );

function FileLogRoute( params) {
  this._init( params);
}


FileLogRoute.prototype._init = function( params ) {
  this._log_cache     = [];
  this._log_file_path = null;
  this._max_file_size = 1024;  // in KiB
  this._max_log_files = 5;

  var self = this;
  this._interval_id  = setInterval( function() {
    self.process_logs();
  }, 1000 );

  FileLogRoute.parent._init.call( this, params );
};


FileLogRoute.prototype.log_message = function ( message ) {
  this._log_cache.push( this._format( message ) );
};


FileLogRoute.prototype.process_logs = function () {
  if ( !this._log_cache.length ) return false;
  if ( !this._log_file_path )
    this._log_file_path = path.join( this.app.base_dir, 'runtime/autodafe.log' )

  this.logger.log( 'Process logs', 'trace', 'FileLogRoute' );

  var file_emitter = new process.EventEmitter;
  var self         = this;

  fs.exists( this._log_file_path, function( exists ) {
    if ( exists ) {
      fs.stat( self._log_file_path, function( e, stats ) {
        if ( e ) return self._on_error( e );
        if ( stats.size > self._max_file_size * 1024 ) self._rotate_files( self._max_log_files, file_emitter );
        else file_emitter.emit( 'ready_to_write' );
      } );
    }
    else file_emitter.emit( 'ready_to_write' );
  });

  file_emitter.on( 'ready_to_write', function() {
    self.logger.log( 'Writes logs to file', 'trace', 'FileLogRoute' );

    fs.open( self._log_file_path, 'a', 0666, function( e, fd ) {

      if ( e ) return self._on_error( e );

      self._log_cache.push('');
      fs.write( fd, self._log_cache.join( "\n" ), null, 'utf8', function( e, written ) {
        fs.close( fd );
        if ( e ) return self._on_error( e );
      } );

      self._log_cache = [];
    } );

  } );
};


FileLogRoute.prototype._rotate_files = function ( f, file_emitter ) {
  if ( f == this._max_log_files ) this.logger.log( 'Rotate files', 'trace', 'FileLogRoute' );
  if ( f < 0 ) return file_emitter.emit( 'ready_to_write' );

  var self        = this;
  var rotate_file = this._log_file_path + ( f ? '.' + f : '' );

  fs.exists( rotate_file, function( exists ) {
    if ( !exists ) return self._rotate_files( f - 1, file_emitter );

    var next = function( e ) {
      if ( e ) return self._on_error( e );
      self._rotate_files( f - 1, file_emitter );
    };

    if ( f == self._max_log_files ) fs.unlink( rotate_file, next );
    else fs.rename( rotate_file, self._log_file_path + '.' + ( f + 1 ), next );
  } );
};


FileLogRoute.prototype._on_error = function ( e ) {
  this.logger.log( e, 'error', 'FileLogRoute' );

  clearInterval( this._interval_id );

  this.logger.log( 'File route is stopped', 'warning', 'FileLogRoute' );
};