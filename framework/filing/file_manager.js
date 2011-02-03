var Component = require('components/component');
var fs        = require('fs');
var path      = require('path');

var FileManager = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( FileManager, Component );


FileManager.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this.default_folder = params.default_folder;
};


FileManager.prototype.get_files = function ( folder ) {
  folder = path.join( this.app.base_dir, folder || this.default_folder );

  var emitter = new process.EventEmitter;
  var self    = this;

  this.app.log( 'Collecting files in "%s"'.format( folder ), 'trace', 'FileManager' );
  fs.readdir( folder, function( e, files ) {
    if ( e ) {
      emitter.emit( 'fail', e );
      return self.app.log( e, 'FileManager' );
    }

    var result = [];

    try {
      for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {
        var file      = files[f];
        var file_path = path.join( folder, file );
        var stat      = fs.statSync( file_path );
        if ( stat.isFile() ) result.push( file );
      }
    } catch (e) {
      self.app.log( e, 'FileManager' );
      emitter.emit( 'fail', e );
    }

    emitter.emit( 'complete', result );
  } );

  return emitter;
};