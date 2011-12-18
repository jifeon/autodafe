var Component = global.autodafe.Component;

module.exports = AnotherNestedComponent.inherits( Component );

function AnotherNestedComponent( params ) {
  this._init( params );
}


AnotherNestedComponent.prototype._init = function( params ) {
  AnotherNestedComponent.parent._init.call( this, params );

  this.param = params.param;
};