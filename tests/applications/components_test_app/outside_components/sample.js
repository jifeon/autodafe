module.exports = SampleComponent.inherits( autodafe.Component );

function SampleComponent( params ) {
  this._init( params );
}


SampleComponent.prototype._init = function( params ) {
  SampleComponent.parent._init.call( this, params );

  this.models_in_app = this.app.models;
}