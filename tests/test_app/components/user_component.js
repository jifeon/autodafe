var Component = global.autodafe.Component;

module.exports = UserComponent.inherits( Component );

function UserComponent( params ) {
  this._init( params );
}


UserComponent.prototype._init = function( params ) {
  this.super_._init( params );

  this.param = params.param;
}