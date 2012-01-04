module.exports = HiddenComponent.inherits( autodafe.Component );

function HiddenComponent( params ) {
  this._init( params );
}


HiddenComponent.prototype._init = function( params ) {
  HiddenComponent.parent._init.call( this, params );

  this.param = params.param;
};