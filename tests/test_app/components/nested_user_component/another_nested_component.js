var Component = global.autodafe.Component;

module.exports = AnotherNestedComponent.inherits( Component );

function AnotherNestedComponent( params ) {
  this._init( params );
}


AnotherNestedComponent.prototype._init = function( params ) {
  this.super_._init( params );

  this.param = params.param;
};