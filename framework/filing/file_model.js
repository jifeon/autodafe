var Model = require('model');
var path = require('path');
var fs = require('fs');

var FileModel = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( FileModel, Model );


FileModel.prototype._init = function( params ) {
  Model.prototype._init.call( this, params );

  this.name       = params.name     || '';
  this.encoding   = params.encoding || 'utf8';
  this.content    = params.content  || '';

  var self = this;
  this._path = path.join( this.app.base_dir, this.app.files.default_folder );
  path.exists( this._path, function( exists ) {
    if ( !exists ) self.app.log( 'File path %s does not exist'.format( this._path ), 'warning', 'FileModel' );
  } );
};


FileModel.prototype.save = function () {
  if ( !this.name ) return this.app.log( 'You must specify file\'s name', 'error', 'FileModel' );

  this.app.log( 'Saving file "%s"'.format( this.name ), 'trace', 'FileModel' );

  var emitter = new process.EventEmitter;

  var self = this;
  fs.open( path.join( this._path, this.name ), 'a', 0666, function( e, fd ) {

    if ( e ) {
      emitter.emit( 'error', e.message );
      return self.app.log( e, 'FileModel' );
    }

    fs.write( fd, self.content, null, self.encoding, function( e, written ) {
      fs.close( fd );
      if ( e ) {
        emitter.emit( 'error', e.message );
        return self.app.log( e, 'FileModel' );
      }

      emitter.emit( 'complete' );
    } );
  } );

  return emitter;
};

