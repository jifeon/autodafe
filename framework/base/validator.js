var AppModule       = require('app_module');

module.exports = Validator.inherits( AppModule );

function Validator( params ) {
  this._init( params );
}

Validator.prototype._init = function ( params ) {
  this.super_._init( params );
  this.errors = [];
}

Validator.prototype.greater = function ( field_name, value, length ){
  if( value.length < length  ) this.errors.push( field_name + " should be greater then " + length + " symbols: " + value );
}

Validator.prototype.lesser = function ( field_name, value, length ){
  if( value.length > length ) this.errors.push( field_name + " should be lesser then " + length + " symbols:" + value );
}

Validator.prototype.correct_email = function ( field_name, value ){
  var regexp = /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
  if( value.search( regexp ) != 0 )
    this.errors.push ( "wrong email: " + value );
}

Validator.prototype.letters_only = function ( field_name, value ){
  if( !Object.isEmpty( value ) && value.search(/^[a-zA-Z ]+$/) != 0 )
    this.errors.push( "only letters expected in '" + field_name + "': " + value );
}

Validator.prototype.md5 = function( field_name, value ){
  if( value.search(/^[a-f0-9]{32}$/) != 0 )
    this.errors.push( field_name + ' not md5: ' + value );
}

Validator.prototype.required = function( field_name, value ){
  if( Object.isEmpty( value ) )
    this.errors.push( field_name + ' required' );
}
