var path = require('path');

module.exports = Response.inherits( global.autodafe.AppModule );

function Response( params ) {
  this._init( params );
}


Response.prototype._init = function( params ) {
  Response.parent._init.call( this, params );

  this.controller = params.controller;
  this.params     = {};

  if ( !params.request ) this.log(
    '`request` is undefined in Response constructor. An error will be thrown if you try send this response',
    'warning' );
  this.request        = params.request;

  this._path_to_view  = path.join( this.controller.views_path, params.view + this.controller.views_ext );

//  this._emitter_count = 0;
//  this._sent          = false;

//  this.system_error     = this.controller.handle_system_error.bind( this.controller, this );
//  this.validation_error = this.controller.handle_validation_errors.bind( this.controller, this );

  this.params.cd  = this.controller.views_folder;
};


Response.prototype.view_name = function( name ){
  if ( !name ) return path.basename( this._path_to_view, path.extname( this._path_to_view ));

  this._path_to_view = path.join( path.dirname( this._path_to_view ), name + this.view_extension());
  return this;
}


Response.prototype.view_extension = function( ext ){
  if ( !ext ) return path.extname( this._path_to_view );

  if ( ext.charAt(0) != '.' ) ext = '.' + ext;
  this._path_to_view = path.join( path.dirname( this._path_to_view ), this.view_name() + ext);
  return this;
}


Response.prototype.view_file_name = function( name ){
  if ( !name ) return this.view_name() + this.view_extension();

  this._path_to_view = path.join( path.dirname( this._path_to_view ), name);
  return this;
}


Response.prototype.view_path = function( p ){
  if ( !p ) return this._path_to_view;

  this._path_to_view = path.resolve( this.app.path_to_views, p );
  return this;
}


Response.prototype.new_async_tool = function(){
  return new global.autodafe.cc.AsyncListener({
    app      : this.app,
    response : this
  });
}




Response.prototype.send = function( params ){
  if ( params instanceof Error ) return this.client.send_error( params );

  this._sent = true;
  this.merge_params( params );

  var self = this;
  process.nextTick(function(){
    if ( !self._emitter_count ) {
      self.controller.respond( self.view, self.params ).to( self.client );
    }
  });

  return this;
};


Response.prototype.after = function( ee ){
  this._process_emitter( ee );
};


Response.prototype.merge_params = function( params ){
  var EE    = process.EventEmitter;

  for ( var name in params ) {
    var value = params[ name ];
    if ( value instanceof EE && value.constructor == EE && !this.params[ name ] ) {
      this._process_emitter( value, name );
    }

    this.params[ name ] = value;
  }

  return this;
};


Response.prototype.create_listener = function(){
  return this.controller.create_listener( this );
};


Response.prototype.redirect = function( uri ){
  return this.client.redirect( uri );
};


Response.prototype._process_emitter = function( emitter, name ){
  var self = this;

  this._emitter_count++;
  emitter
    .on('error',     this.system_error )
    .on('not_valid', this.validation_error )
    .on('success', function( result ){
      if ( name ) self.params[ name ] = result;
      if ( !--self._emitter_count && self._sent ) {
        self.controller.respond( self.view, self.params ).to( self.client );
      }
    } );
};