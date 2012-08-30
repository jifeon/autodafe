module.exports = Listener;

Listener.inherits( process.EventEmitter );

function Listener() {
  this._init();
}


Listener.prototype._init = function(){
  this.behaviors = {};
  this.count     = 0;
  this.args      = [];
  this.arg_num   = 0;
  this.arg_0     = 0;
}


Listener.prototype.handle_emitter = function( emitter ){
  this.count++;

  var n = this.arg_num++;
  emitter.on( 'success', this._handle_success.bind( this, n ));
  emitter.on( 'error',   this._handle_error.bind( this, n ));

  for ( var action in this.behaviors ){
    emitter.on( action, this._run_behavior.bind( this, action, n ) );
  }
}


Listener.prototype.get_callback = function(){
  var self = this;
  this.count++;

  var n = this.arg_num++;
  return this._listener_callback.bind( this, n );
}


Listener.prototype.behavior_for = function( action, cb ){
  this.behaviors[ action ] = cb;
}


Listener.prototype._listener_callback = function( n, e, res ){
  if (e) this._handle_error(n, e);
  else   this._handle_success(n, res);
}


Listener.prototype._handle_error = function( n, e ){
  if ( !this._check_arg_num(n) ) return;

  this.reset();
  this.emit( 'error', e );
}


Listener.prototype._handle_success = function( n, res ){
  if ( !this._check_arg_num(n) ) return;

  this.args[n - this.arg_0] = res;
  if ( --this.count ) return;

  var args = this.args.slice(0);
  args.unshift( 'success' );

  this.reset();
  this.emit.apply( this, args );
}


Listener.prototype._run_behavior = function( action, n ){
  if ( !this._check_arg_num(n) ) return;

  this.reset();
  this.behaviors[ action ].apply( null, Array.prototype.slice.call( arguments, 2 ));
}


Listener.prototype.reset = function(){
  this.count = 0;
  this.arg_0 = this.arg_num;
  this.args  = [];
}


Listener.prototype._check_arg_num = function( n ){
  return n >= this.arg_0;
}