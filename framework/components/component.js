var AppModule = global.autodafe.AppModule;

module.exports = Component.inherits( AppModule );

function Component( params ) {
  this._init( params );
}


Component.prototype._init = function( params ) {
  Component.parent._init.call( this, params );

  if ( typeof params.name != 'string' )
    throw new Error( 'Please set `name` for creating component' );
  this._.name = params.name;
};


Component.prototype.get = function () {
  return this;
};