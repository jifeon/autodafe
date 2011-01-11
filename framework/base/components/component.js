var Component = module.exports = function( params ) {
  this._init( params );
};


Component.prototype._init = function( params ) {
  this.name = params.name;
  this.app = global.autodafe.app;

  if ( !this.name || typeof this.app[ this.name ] != 'undefined' ) {
    console.log( 'Conflict in component\'s name: "' + this.name + '"' );
  }

  this._define_getter();
};


Component.prototype._define_getter = function () {
  var self = this;
  this.app.__defineGetter__( this.name, function() {
    return self;
  } );
};