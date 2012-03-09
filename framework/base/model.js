var AppModule = global.autodafe.AppModule;
var Validator = require('./validator');

module.exports = Model.inherits( AppModule );

function Model( params ) {
  this._init( params );
}


Model.prototype._init = function ( params ) {
  Model.parent._init.call( this, params );

  this.models = this.app.models;

  this._attributes = {};
  this._.validator = new Validator( params );
  this._.is_new    = params.is_new == undefined ? true : params.is_new;
  this._.is_inited = true;
};


Model.prototype.attributes_description = function () {
  return {};
};


Model.prototype.set_attribute = function ( name, value ) {
  if ( this.hasOwnProperty( name ) ) this[ name ] = value;
  else this._attributes[ name ] = value;
};


Model.prototype.get_attribute = function ( name ) {
  var attribute = this._attributes[ name ] != undefined ? this._attributes[ name ] : this[ name ];

  return typeof attribute == 'function' ? attribute.bind( this )  : attribute;
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

  var attribute_names = this.get_safe_attributes_names();

  for ( var name in attributes ) {
    if ( attribute_names.indexOf( name ) != -1 ) this.set_attribute( name, attributes[ name ] );
    else {
      this.log( '%s.set_attributes try to set unsafe parameter "%s"'.format( this.class_name, name ), 'warning' );
      this.emit( 'set_unsafe_attribute', name, attributes[ name ] );
    }
  }
};


Model.prototype.save = function ( attributes, scenario ) {
  scenario = scenario || this.is_new ? 'create' : 'update';

  return this.validate( this.attributes_description(), scenario );
};


Model.prototype.remove = function () {
  return true;
};


Model.prototype.get_safe_attributes_names = function () {
  return [];
};


Model.prototype.equals = function ( model ) {
  return this == model;
};


Model.prototype.validate = function ( rules, scenario ){
  this.validator.splice_errors();

  rules = rules || this.attributes_description();

  for( var attribute in rules ){

    rules[ attribute ].forEach( function( rule ) {

      if ( !Object.isObject( rule ) )
        return this.validator[ rule ]( attribute, this.get_attribute( attribute ) );

      if ( rule.on && rule.on != scenario ) return;

      for( var rule_name in rule ){
        if ( rule_name == 'on' ) continue;
        this.validator[ rule_name ]( attribute, this.get_attribute( attribute ), rule[ rule_name ] );
      }
    }, this );
  }

  return !this.has_errors();
}


Model.prototype.has_errors = function () {
  return ( this.validator.errors.length == 0 ) ? false : this.validator.errors.length;
}


Model.prototype.get_errors = function(){
  return this.validator.splice_errors();
}