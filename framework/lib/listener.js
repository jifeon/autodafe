module.exports = Listener;

Listener.inherits( process.EventEmitter );

function Listener( count, callback, params, options ) {
  if ( !isFinite( count ) )
    throw new Error( '`count` should be a number in Listener.init' );

  this.count    = count;
  this.callback = callback  || function(){};
  this.params   = params    || {};
  this.options  = options   || {};
  this.fired    = false;

  if ( !this.count && !this.options['do_not_fire'] ) this.fire();
}


Listener.prototype.fire = function () {
  if ( this.fired ) return false;

  this.fired = true;
  this.callback(
    this.options[ 'error_in_callback' ] ? this.params.error || null : this.params,
    this.options[ 'error_in_callback' ] ? this.params : undefined
  );

  if ( this.params.error )  this.emit( 'error',   this.params.error );
  else                      this.emit( 'success', this.params );
};


Listener.prototype.check_count = function () {
  if ( this.count <= 0 || this.params.error ) this.fire();
};


Listener.prototype.listen = function () {
  var argument_names  = Array.prototype.slice.call( arguments );
  var self            = this;

  return function() {
    for ( var i = 0, i_ln = argument_names.length; i < i_ln; i++ )
      self.params[ argument_names[i] ] = arguments[i];

    self.count--;
    self.check_count();
  }
};


Listener.prototype.get_emitter = function ( name ) {
  var emitter = new process.EventEmitter;
  var self    = this;

  emitter.on( 'error',   this.register.bind( this, 'error' ) );
  emitter.on( 'success', this.register.bind( this, name ) );

  return emitter;
};


Listener.prototype.register = function ( name, value ) {
  if ( name ) this.params[ name ] = value;

  this.count--;
  this.check_count();
};