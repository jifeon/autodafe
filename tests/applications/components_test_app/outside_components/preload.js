module.exports = PreloadComponent.inherits( autodafe.Component );

function PreloadComponent( params ) {
  this._init( params );
}


PreloadComponent.prototype._init = function( params ) {
  PreloadComponent.parent._init.call( this, params );

  this.models_in_app = this.app.models;
};