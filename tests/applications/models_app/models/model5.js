module.exports = Model5.inherits( autodafe.Model );

function Model5( params ) {
  this._init( params );

  this.guest = params.guest;
}


Model5.prototype.attributes = function( params ) {
  return {
    username : {
      safe         : true,
      required     : true,
      range_length : [4, 20],
      prefilters   : 'trim',
      errors       : {
        required : '{field} required'
      }},

    password  : ['safe required', {
      min_length : 6,
      postfilters : ['md5', function(v){ return v.slice(1); }],
      errors     : {
        min_length : 'Field {field} should have {length} ch.'
      }
    }],
    email     : {
      'safe required email key' : true,
      errors : {
        email : 'Please enter email instead of "{value}"'
      }
    }
  };
};