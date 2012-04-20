module.exports = Validator.inherits( autodafe.AppModule );

function Validator( params ) {
  this._init( params );
}


Validator.prototype._init = function ( params ) {
  Validator.parent._init.call( this, params );

  this._email   = /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i;
  this._url     = /(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  this._letters = /^[a-zA-Z]*$/;
  this._phone   = /^[0-9#\-+() ]*$/;
}


Validator.prototype.required = function( field, value, required, error ){
  if ( value || value === false || !required ) return null;

  return this.t( error || 'This field is required' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value
  });
}


Validator.prototype.min_length = function ( field, value, length, error ){
  if ( !value || value.length >= length ) return null;

  return this.t( error || 'Please enter at least {length} characters' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value,
    '{length}'  : length
  });
}


Validator.prototype.max_length = function ( field, value, length, error ){
  if( !value || value.length <= length ) return null;

  return this.t( error || 'Please enter no more than {length} characters' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value,
    '{length}'  : length
  });
}


Validator.prototype.range_length = function( field, value, range, error ){
  if ( !value || !Array.isArray( range ) || range.length != 2 || value.length >= range[0] && value.length <= range[1] )
    return null;

  return this.t( error || 'Please enter a value between {min_length} and {max_length} characters long' ).format({
    '{field}'       : this.t( field ),
    '{value}'       : value,
    '{min_length}'  : range[0],
    '{max_length}'  : range[1]
  });
};


Validator.prototype.min = function( field, value, min, error ){
  var n = Number( value );
  if( !value || n >= min ) return null;

  return this.t( error || 'Please enter a value greater than or equal to {min}' ).format({
    '{field}' : this.t( field ),
    '{value}' : value,
    '{min}'   : min
  });
};


Validator.prototype.max = function( field, value, max, error ){
  var n = Number( value );
  if( !value || n <= max ) return null;

  return this.t( error || 'Please enter a value less than or equal to {max}' ).format({
    '{field}' : this.t( field ),
    '{value}' : value,
    '{max}'   : max
  });
};


Validator.prototype.range = function( field, value, range, error ){
  var n = Number( value );
  if ( !value || !Array.isArray( range ) || range.length != 2 || n >= range[0] && n <= range[1] )
    return null;

  return this.t( error || 'Please enter a value between {min} and {max}' ).format({
    '{field}' : this.t( field ),
    '{value}' : value,
    '{min}'   : range[0],
    '{max}'   : range[1]
  });
};


Validator.prototype.email = function ( field, value, need_check, error ){
  if( !value ||  !need_check || this._email.test( value ) ) return null;

  return this.t( error || 'Please enter a valid email address' ).format( {
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


Validator.prototype.letters_only = function ( field, value, re, error ){
  if ( !re ) return null;
  re = re instanceof RegExp ? re : this._letters;

  if( re.test( value )) return null;

  return this.t( error || 'Please enter only letters' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


Validator.prototype.md5 = function( field, value, need_check, error ){
  if ( !value || /^[a-f0-9]{32}$/.test( value ) ) return null;

  return this.t( error || 'Field {field} should be md5 hash' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


Validator.prototype.in_array = function( field, value, array, error ){
  if ( !value || !array || !Array.isArray( array ) || ~array.indexOf( value ) ) return null;

  return this.t( error || 'This field should be equal to one of that values: {values}' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value,
    '{values}'  : array.join(', ')
  });
}


Validator.prototype.number = function( field, value, need_check, error ){
  if ( value === '' || !need_check || isFinite( value ) ) return null;

  return this.t( error || 'Please enter a valid number' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


Validator.prototype.phone_number = function ( field, value, need_check, error ) {
  if ( !value || !need_check || this._phone.test( value ) ) return null;

  return this.t( error || 'Please enter a valid phone number' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
};


Validator.prototype.url = function ( field, value, need_check, error ) {
  if ( !value || !need_check || this._url.test( value ) ) return null;

  return this.t( error || 'Please enter a valid URL' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
};


Validator.prototype.match = function ( field, value, re, error ) {
  if ( !value || ( new RegExp(re) ).test( value ) ) return null;

  return this.t( error || 'Please enter a valid value' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
};


Validator.prototype.equal = function( field, value, expected, error ){
  if ( !value || value == expected ) return null;

  return this.t( error || 'Value should be equal to {expected}' ).format({
    '{field}'     : this.t( field ),
    '{value}'     : value,
    '{expected}'  : expected
  });
};
