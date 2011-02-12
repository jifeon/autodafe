var Model = require('model');
var path  = require('path');
var fs    = require('fs');

var FileModel = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( FileModel, Model );


FileModel.model = function( clazz ) {
  return ( clazz || FileModel ).prototype;
}


FileModel.prototype._init = function( params ) {
  Model.prototype._init.call( this, params );

  this.__defineGetter__( 'name', function() {
    return this.__name;
  } );

  this.__defineSetter__( 'name', function( name ) {
    var new_name = name && !path.extname( name ) ? name + '.' + this.get_ext() : name;

    if ( this.__name && this.__name != new_name ) {
      this.__rename   = true;
      this.__src_name = this.__name;
    }

    this.__name = new_name;
  } );

  this.__defineGetter__( 'content', function() {
    return this.__content || '';
  } );

  this.__defineSetter__( 'content', function( content ) {
    this.__write_content = true;

    this.__content = content && content.toString();
  } );

  this.name       = params.name;
  this.encoding   = params.encoding || 'utf8';
  this.content    = params.content;

  this.__new            = true;
  this.__rename         = false;
  this.__write_content  = false;

  var self = this;
  this._path = path.join( this.app.base_dir, this.app.files.default_folder );
  path.exists( this._path, function( exists ) {
    if ( !exists ) {
      self.app.log( 'Dir path %s does not exist'.format( this._path ), 'warning', 'FileModel' );
      self.emit( 'not_found' );
      return false;
    }

    self.emit( 'found' );
    return true;
  } );
};


FileModel.prototype.is_new = function () {
  return this.__new;
};


FileModel.prototype.set_new = function ( n ) {
  this.__new = n;
};


FileModel.prototype.get_ext = function () {
  return '';
};


FileModel.prototype.get_content = function( name ){
  var file = !name ? this : new this.constructor( {
    name : name
  });

  var emitter = new process.EventEmitter;

  var self = this;
  file.on( 'found', function() {
    var file_path = file.get_path();
    self.app.log( 'Try to read file: %s'.format( file_path ), 'trace', 'FileModel' );

    fs.readFile( file_path, 'utf8', function ( e, data ) {
      if ( e ) {
        emitter.emit( 'fail', e );
        self.app.log( e, 'FileModel' );
        return;
      }

      emitter.emit( 'complete', data );
    });
  } )
  .on( 'not_found', function() {
    var e = new Error( 'File %s not found'.format( file.name ) );
    emitter.emit( 'fail', e );
    self.app.log( e, 'FileModel' );
  } );

  if ( !name ) file.emit( 'found' );

  return emitter;
}


FileModel.prototype.get = function( name ){
  var file = new this.constructor( {
    name : name
  });

  var emitter = new process.EventEmitter;

  var self = this;
  file.on( 'found', function() {

    path.exists( file.get_path(), function( exists ) {
      file.set_new( !exists );

      emitter.emit( 'complete', file );
    } );
  } )
  .on( 'not_found', function() {
    var e = new Error( 'File %s not found'.format( file.name ) );
    emitter.emit( 'fail', e );
    self.app.log( e, 'FileModel' );
  } );

  return emitter;
}


FileModel.prototype.find_all = function ( re ) {
  var emitter = new process.EventEmitter;

  if ( re == undefined ) {
    var ext = this.get_ext();
    re = new RegExp( '.*' + ( ext ? '\\.' + ext : '' ) + '$', 'i' );
  }

  if ( !( re instanceof RegExp ) ) {
    var e = new Error( 'find_all need regular expression as argument' );
    this.app.log( e.message, 'warning', 'FileModel' );
    process.nextTick( function() {
      emitter.emit( 'fail', e );
    } );
    return emitter;
  }

  this.app.files.get_files()
  .on( 'complete', function( files ) {
    var result = [];

    for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {
      var file = files[f];
      if ( re.test( file ) ) result.push( file );
    }

    emitter.emit( 'complete', result );
  } )
  .on( 'fail', function( e ) {
    emitter.emit( 'fail', e );
  } );

  return emitter;
};


FileModel.prototype.save = function () {
  if ( !this.name ) return this.app.log( 'You must specify file\'s name', 'error', 'FileModel' );

  this.app.log( 'Saving file "%s"'.format( this.name ), 'trace', 'FileModel' );

  var emitter = new process.EventEmitter;

  var self = this;

  var next = function() {
    if ( self.is_new() || self.__write_content ) self.__write_file( emitter );
    else emitter.emit( 'complete' );
  }

  if ( this.__rename ) {
    this.app.log( 'Rename "%s" to "%s"'.format( this.__src_name, this.__name ), 'trace', 'FileModel' );

    fs.rename( this.get_path( this.__src_name ), this.get_path(), function( e ) {
      if ( e ) {
        self.app.log( e, 'FileModel' );
        emitter.emit( 'fail', e );
        return false;
      }

      next();
    } );
  }
  else next();

  return emitter;
};


FileModel.prototype.__write_file = function ( emitter ) {
  var self = this;
  fs.writeFile( this.get_path(), self.content, self.encoding, function( e ) {
    if ( e ) {
      emitter.emit( 'fail', e.message );
      return self.app.log( e, 'FileModel' );
    }

    emitter.emit( 'complete' );
  } );
};


FileModel.prototype.get_path = function ( name ) {
  return path.join( this._path, name || this.name );
};

