var Component = require('components/component');

module.exports = HiddenComponent.inherits( Component );

function HiddenComponent( params ) {
  this._init( params );
}


HiddenComponent.prototype._init = function( params ) {
  this.super_._init( params );

  this.param = params.param;
};