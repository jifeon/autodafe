module.exports = NestedComponent.inherits( autodafe.Component );

function NestedComponent( params ) {
  this._init( params );
}


NestedComponent.prototype._init = function( params ) {
  NestedComponent.parent._init.call( this, params );

  this.param = params.param;
};