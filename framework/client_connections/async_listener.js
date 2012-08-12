module.exports = Listener.inherits( global.autodafe.AppModule );

function Listener( params ) {
  this._init( params );
}


Listener.__current_stack = null;
Listener.__emitter       = null;


process.EventEmitter.prototype.valueOf = function(){
  Listener.__emitter = this;
  return Object.prototype.valueOf.call( this );
}


Listener.prototype._init = function( params ) {
  Listener.parent._init.call( this, params );

  this.response       = params.response;
  this.callback       = null;
  this.emitter        = new process.EventEmitter;
  this.async_listener = this.app.tools.create_async_listener( 0, this.finish.bind( this ), null, {
    do_not_fire: true
  } );

  this.__stack = {
    valueOf : function(){
      Listener.__current_stack = this;
      return 0;
    }
  };

  Object.defineProperty( this, 'stack', {
    get : function(){
      return this.__stack;
    },

    set : function(){
      if ( !Listener.__emitter || Listener.__current_stack != this.__stack ) return false;

      var emitter        = Listener.__emitter;
      Listener.__emitter = null;
      this.handle_emitter( emitter );
    }
  } );
};


Listener.prototype.handle_emitter = function( emitter ){
  this.async_listener.count++;
  emitter
    .re_emit( 'success', 'error', this.async_listener.get_emitter( this.async_listener.count - 1 ) )
    .on('not_valid', this.response.validation_error );
};


Listener.prototype.success = function( callback ){
  this.callback = callback;
};


Listener.prototype.finish = function( params ){
  if ( params.error ) {
    this.response.system_error( params.error );
    return false;
  }

  var result = null;
  if ( this.callback ) {

    var args = [];
    for ( var n in params ) {
      args[ n ] = params[n];
    }

    result = this.callback.apply( null, args );
  }
  else result = this.response.controller.handle_success( params );

  this.emitter.emit( 'success', result );
};