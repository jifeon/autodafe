var Component = global.autodafe.Component;

module.exports = UserComponent.inherits( Component );

function UserComponent( params ) {
  this._init( params );
}


UserComponent.prototype._init = function( params ) {
  UserComponent.parent._init.call( this, params );

  this.param = params.param;
}