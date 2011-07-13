var AppModule = require('app_module');
var Validator = require('validator');

module.exports = Model.inherits( AppModule );

function Model( params ) {
  this._init( params );
}


Model.prototype._init = function ( params ) {
  this.super_._init( params );

  this._attributes = {};
  this.validator = new Validator( params );
  this._.is_new = params.is_new == undefined ? true : params.is_new;
};


Model.prototype.set_attribute = function ( name, value ) {
  if ( this.hasOwnProperty( name ) ) this[ name ] = value;
  else this._attributes[ name ] = value;
};


Model.prototype.get_attribute = function ( name ) {
  var attribute = this._attributes[ name ] != undefined ? this._attributes[ name ] : this[ name ];
  if ( attribute == undefined ) attribute = null;

  var self = this;
  return typeof attribute == 'function' ? function() {
    return attribute.apply( self, arguments );
  } : attribute;
};


Model.prototype._clean_attributes = function () {
  this._attributes = {};
};


Model.prototype.get_attributes = function( names ) {
  if ( names instanceof Array ) {

    var attrs = {};

    names.forEach( function( name ){
      attrs[ name ] = this.get_attribute( name );
    }, this );

    return attrs;
  }
  else return Object.not_deep_clone( this._attributes );
};


Model.prototype.set_attributes = function ( attributes ) {
  if ( !Object.isObject( attributes ) )
    throw new Error( 'First argument to `%s.set_attributes` should be an Object'.format( this.class_name ) );

  var attribute_names = this.get_safe_attribute_names();

  for ( var name in attributes ) {
    if ( attribute_names.indexOf( name ) != -1 ) this.set_attribute( name, attributes[ name ] );
    else {
      this.log( '%s.set_attributes try to set unsafe parameter "%s"'.format( this.class_name, name ), 'warning' );
      this.emit( 'set_unsafe_attribute', name, attributes[ name ] );
    }
  }
};


Model.prototype.save = function ( attributes ) {
  return true;
};


Model.prototype.remove = function () {
  return true;
};


Model.prototype.get_safe_attribute_names = function () {
  return this.constructor.safe_attribute_names || [];
};

Model.prototype.validate = function ( rules ){
  var rule;
  for( var i in rules ){
    for( var k = 0, ln = rules[ i ].length; k < ln; k++){
      rule = rules[ i ][ k ];
      if( !Object.isObject( rule ) ){
        this.validator[ rule ].call( this.validator, i, this._attributes[ i ] );
      } else {
        for( var j in rule ){
          this.validator[ j ].call( this.validator, i, this._attributes[ i ], rule[ j ] );
        }
      }
    }
  }
}

Model.prototype.has_errors = function () {
  return ( this.validator.errors.length == 0 ) ? false : this.validator.errors.length;
}

Model.prototype.get_errors = function( error_number ){
  if( this.has_errors() )
    if( isNaN(error_number) ) return this.validator.errors;
      else return this.validator.errors[ error_number ];
}