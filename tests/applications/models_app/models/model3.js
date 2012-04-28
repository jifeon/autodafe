module.exports = Model3.inherits( autodafe.Model );

function Model3( params ) {
  this._init( params );

  this.guest = params.guest;
}


Model3.prototype.attributes = function( params ) {
  return {
    login : {
      safe         : true,
      key          : true,
      required     : true,
      range_length : [4, 20] },

    password  : ['safe required', {min_length : 6}],
    email     : 'safe required email key'
  };
};