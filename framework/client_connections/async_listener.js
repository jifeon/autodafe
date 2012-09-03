module.exports = AsyncListener.inherits( global.autodafe.lib.Listener );

function AsyncListener( params ) {
  this._init( params );
}


AsyncListener.prototype._init = function( params ) {
  AsyncListener.parent._init.call( this, params );

  this.response       = params.response;

  this._init_behaviors( params.behaviors );
};


AsyncListener.prototype._init_behaviors = function( behaviors ){
  Object.merge( this.behaviors, behaviors );
  var self = this;

  this.response.controller.on( 'new_behavior', function( action, cb ){
    self.behavior_for( action, cb.bind( null, self.response, self.response.request ));
  } );
}


AsyncListener.prototype.handle_error = function( e ){
  this.response.handle_error(e);
}