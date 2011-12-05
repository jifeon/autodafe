var AppModule       = global.autodafe.AppModule;

module.exports = Validator.inherits( AppModule );

function Validator( params ) {
  this._init( params );
}


Validator.prototype._init = function ( params ) {
  this.super_._init( params );
  this.errors = [];

  this._email = /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i;
  this._url   = /(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
}


Validator.prototype.splice_errors = function () {
  return this.errors.splice(0);
};


Validator.prototype.greater = function ( field_name, value, length, error ){
  if ( value && value.length < length  )
    this.errors.push( this.t( error || 'Field {field_name} should be greater then {length}' ).format({
      '{field_name}' : this.t( field_name ),
      '{length}'     : length
    }) );
}


Validator.prototype.lesser = function ( field_name, value, length, error ){
  if( value && value.length > length )
    this.errors.push( this.t( error || 'Field {field_name} should be lesser then {length}' ).format({
      '{field_name}' : this.t( field_name ),
      '{length}'     : length
    }) );
}


Validator.prototype.correct_email = function ( field_name, value, error ){
  if( !this._email.test( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should be valid email' ).format( {
      '{field_name}' : this.t( field_name )
    } ) );
}


Validator.prototype.letters_only = function ( field_name, value, error ){
  if( !/^[a-zA-Z]*$/.test( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should contain only letters' ).format({
      '{field_name}' : this.t( field_name )
    }) );
}


Validator.prototype.md5 = function( field_name, value, error ){
  if ( !/^[a-f0-9]{32}$/.test( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should be md5 hash' ).format({
      '{field_name}' : this.t( field_name )
    }) );
}


Validator.prototype.required = function( field_name, value, error ){
  if( value == null || value === '' )
    this.errors.push( this.t( error || 'Field {field_name} is required' ).format({
      '{field_name}' : this.t( field_name )
    }) );
}


Validator.prototype.in_array = function( field_name, value, array, error ){
  if ( !~array.indexOf( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should be one of that values: {values}' ).format({
      '{field_name}'  : this.t( field_name ),
      '{values}'      : array.join(', ')
    }) );
}


Validator.prototype.is_number = function( field_name, value, error ){
  if( isNaN( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should be a number' ).format({
      '{field_name}'  : this.t( field_name )
    }) );
}


Validator.prototype.phone_number = function ( field_name, value, error ) {
  if ( !/^[0-9#\-+() ]*$/.test( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should be a phone number' ).format({
      '{field_name}'  : this.t( field_name )
    }) );
};


Validator.prototype.url = function ( field_name, value, error ) {
  if ( value && !this._url.test( value ) )
    this.errors.push( this.t( error || 'Field {field_name} should be a valid url' ).format({
      '{field_name}'  : this.t( field_name )
    }) );
};


Validator.prototype.match = function ( field_name, value, re, error ) {
  if ( !( new RegExp(re) ).test( value ) )
    this.errors.push( this.t( error || 'Field {field_name} is not valid' ).format({
      '{field_name}'  : this.t( field_name )
    }) );
};