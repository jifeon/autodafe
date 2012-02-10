module.exports = Widget.inherits( autodafe.Component );

function Widget( params ){
  this._init( params );
}


Widget.prototype._init = function ( params ) {
  Widget.parent._init.call( this, params );

  this.controller = this.app.router.get_controller( params.controller || this.app.default_controller );
};


Widget.prototype.render = function ( callback ) {
  this.log( 'You should implement method `render` in your widget `%s`'.format( this.name ), 'warning' );
  callback('');
};