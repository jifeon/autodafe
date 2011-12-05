var Component = global.autodafe.Component;

module.exports = NestedComponent.inherits( Component );

function NestedComponent( params ) {
  this._init( params );
}


NestedComponent.prototype._init = function( params ) {
  this.super_._init( params );

  this.param = params.param;
};