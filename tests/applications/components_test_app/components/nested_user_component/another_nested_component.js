module.exports = AnotherNestedComponent.inherits( autodafe.Component );

function AnotherNestedComponent( params ) {
  this._init( params );
}


AnotherNestedComponent.prototype._init = function( params ) {
  AnotherNestedComponent.parent._init.call( this, params );

  this.param = params.param;
};