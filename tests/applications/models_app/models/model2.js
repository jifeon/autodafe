module.exports = Model2.inherits( autodafe.Model );

function Model2( params ) {
  this._init( params );

  this.guest = params.guest;
}


Model2.prototype.attributes = function( params ) {
  return {
    login     : 'safe',
    email     : 'safe key',
    password  : true,
    not_attr  : false
  };
};