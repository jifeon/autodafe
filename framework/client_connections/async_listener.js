module.exports = AsyncListener.inherits( global.autodafe.lib.Listener );

function AsyncListener( params ) {
  this._init( params );
}


AsyncListener.__current_stack = null;
AsyncListener.__emitter       = null;


process.EventEmitter.prototype.valueOf = function(){
  AsyncListener.__emitter = this;
  return Object.prototype.valueOf.call( this );
}


AsyncListener.prototype._init = function( params ) {
  AsyncListener.parent._init.call( this, params );

  this.response       = params.response;

  this._init_stack();
  this._init_behaviors();
};


AsyncListener.prototype._init_stack = function(){
  this.__stack = {
    valueOf : function(){
      AsyncListener.__current_stack = this;
      return 0;
    }
  };

  Object.defineProperty( this, 'stack', {
    get : function(){
      return this.__stack;
    },

    set : function(){
      if ( !AsyncListener.__emitter || AsyncListener.__current_stack != this.__stack ) return false;

      var emitter = AsyncListener.__emitter;
      AsyncListener.__emitter = null;
      this.handle_emitter( emitter );
    }
  } );
}


AsyncListener.prototype._init_behaviors = function(){
  Object.merge( this.behaviors, this.response.behaviors );
  var self = this;

  this.on( 'error', function( e ){
    self.handle_error(e);
  });
  this.on( 'success', function(){
    self.handle_success.apply( self, arguments );
  } );
}


AsyncListener.prototype.handle_error = function( e ){
  this.response.handle_error(e);
}


AsyncListener.prototype.handle_success = function(){}



AsyncListener.prototype.success = function( cb ){
  this.handle_success = cb;
};


AsyncListener.prototype.error = function( f ){
  this.handle_error = f;
}