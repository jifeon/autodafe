module.exports = Response.inherits( global.autodafe.AppModule );

function Response( params ) {
  this._init( params );
}


Response.prototype._init = function( params ) {
  Response.parent._init.call( this, params );

//  if ( !autodafe.Controller.is_instantiate( params.controller ) )
//    throw new Error( '`controller` should be instance of Controller in Response._init' );
//  this.controller = params.controller;
//

  this.view       = params.view;
  this.params     = params.params || {};
  this.client     = params.client;
  this.controller = params.controller;
  this.ui         = this.app.users.get_by_client( this.client );
  this.user       = this.ui.model;

  this._emitter_count = 0;
  this._sent          = false;

  this.system_error     = this.controller.handle_system_error.bind( this.controller, this );
  this.validation_error = this.controller.handle_validation_errors.bind( this.controller, this );

  this.params.cd  = this.controller.views_folder;
};


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