var AppModule = require('app_module');

module.exports = Component.inherits( AppModule );

function Component( params ) {
  this._init( params );
}


Component.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.name )
    throw new Error( 'Please set `name` for creating component' );

  this._.name = params.name;
};


Component.prototype.get = function () {
  return this;
};