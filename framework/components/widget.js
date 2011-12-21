module.exports = Widget.inherits( autodafe.Component );

function Widget( params ){
  this._init( params );
}


Widget.prototype.render = function ( callback ) {
  this.log( 'You should implement method `render` in your widget `%s`'.format( this.name ), 'warning' );
  callback('');
};