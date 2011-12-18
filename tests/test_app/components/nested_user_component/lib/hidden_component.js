var Component = global.autodafe.Component;

module.exports = HiddenComponent.inherits( Component );

function HiddenComponent( params ) {
  this._init( params );
}


HiddenComponent.prototype._init = function( params ) {
  HiddenComponent.parent._init.call( this, params );

  this.param = params.param;
};