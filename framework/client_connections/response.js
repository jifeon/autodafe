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

  this._path_to_view   = path.join( this.controller.views_path, params.view + this.controller.views_ext );
  this.async_listener  = null;
  this._params_names  = [];
  this._global_params_merged = false;

//  this._emitter_count = 0;
//  this._sent          = false;

//  this.params.cd  = this.controller.views_folder;

  this._init_async_listener();
};


Response.prototype._init_async_listener = function(){
  this.async_listener = new global.autodafe.cc.Listener({
    app       : this.app,
    response  : this
  });

  this.async_listener.success( this._try_send.bind( this ) );

  for ( var action in this.controller.behaviors ){
    var behavior = this.controller.behaviors[ action ];
    this.async_listener.behavior_for(action, behavior.bind( null, this, this.request ));
  }
}


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
  return new global.autodafe.cc.Listener({
    app       : this.app,
    response  : this,
    behaviors : this.async_listener.behaviors
  });
}


Response.prototype.handle_error = function( e ){
  this.controller.handle_error(e, this, this.request);
}


Response.prototype.behavior_for = function( action, cb ){
  this.async_listener.behavior_for( action, cb );
}


Response.prototype.send = function( params ){
  if ( this._sent ) return false;
  this._sent = true;

  if ( params instanceof Error ) return this.request.client.send_error( params );
  this.merge_params( params );

  if ( !this._params_names.length ) this.forced_send();
  return this;
};


Response.prototype._try_send = function(){
  for ( var i = 0, i_ln = arguments.length; i<i_ln; i++ )
    this.params[ this._params_names[i] ] = arguments[i];

  this._params_names = [];

  if ( this._sent ) this.forced_send();
}


Response.prototype.forced_send = function(){
  var self      = this;
  var view_name = path.relative( this.app.path_to_views, this.view_path() );

  this.controller.render( view_name, this.params, function( e, data ){
    if ( e ) return self.request.client.send_error( e );

    self.request.client.send( data );
  });

  return this;
}


Response.prototype.merge_params = function( params ){
  if ( !this._global_params_merged ) {
    this._global_params_merged = true;
    this.merge_params( this.controller.global_view_params( this, this.request ));
  }

  var EE = process.EventEmitter;

  for ( var name in params ) {
    var value = params[ name ];
    if ( value.constructor == EE ) {
      this.async_listener.handle_emitter( value );
      this._params_names.push( name );
    }

    this.params[ name ] = value;
  }

  return this;
};


Response.prototype.callback_for = function( name ){
  this._params_names.push( name );
  return this.async_listener.get_callback();
}


Response.prototype.redirect = function( uri ){
  return this.request.client.redirect( uri );
};