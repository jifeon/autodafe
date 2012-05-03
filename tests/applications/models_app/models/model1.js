module.exports = Model1.inherits( autodafe.Model );

function Model1( params ) {
  this._init( params );

  this.guest = params.guest;
}


Model1.prototype.attributes = function( params ) {
  return 'login email password';
};