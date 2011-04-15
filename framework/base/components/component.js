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

  this._define_getter();
};


Component.prototype._define_getter = function () {
  var self = this;

  if ( this.app[ this.name ] )
    throw new Error(
      this.app[ this.name ] instanceof Component
        ? 'Try to create two component with same name: ' + this.name
        : 'Try to create component with name engaged for property of application ' + this.name
    );

  this.app.__defineGetter__( this.name, function() {
    return self;
  } );
};


