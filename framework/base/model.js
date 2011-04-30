var AppModule = require('app_module');

module.exports = Model.inherits( AppModule );

function Model( params ) {
  this._init( params );
}


Model.prototype._init = function ( params ) {
  this.super_._init( params );

  this._attributes = {};
};


Model.prototype.set_attribute = function ( name, value ) {
  if ( this.hasOwnProperty( name ) ) this[ name ] = value;
  else this._attributes[ name ] = value;
};


Model.prototype.get_attribute = function ( name ) {
  return this._attributes[ name ] || this[ name ] || null;
};


Model.prototype.clean_attributes = function () {
  this._attributes = {};
};


Model.prototype.get_attributes = function( table, names ) {
  var attributes = Object.not_deep_clone( this._attributes );

  table.get_column_names().forEach( function( column_name ) {

    if ( this.hasOwnProperty( column_name ) )
      attributes[ column_name ] = this[ column_name ];

    if ( attributes[ column_name ] == undefined )
      attributes[ column_name ] = null;

  }, this );


  if ( names instanceof Array ) {

    var attrs = {};

    names.forEach( function( name ){
      attrs[ name ] = attributes[ name ] != undefined ? attributes[ name ] : null;
    });

    return attrs;
  }

  return attributes;
};


Model.prototype.set_attributes = function ( attributes ) {
  if ( !Object.isObject( attributes ) )
    throw new Error( 'First argument to `%s.set_attributes` should be an Object'.format( this.class_name ) );

  var attribute_names = this.get_attribute_names();

  for ( var name in attributes ) {
    if ( attribute_names.indexOf( name ) != -1 ) this.set_attribute( name, attributes[ name ] );
    else {
      this.log( 'ActiveRecord.set_attributes try to set unsafe parameter "%s"'.format( name ), 'warning' );
      this.emit( 'set_unsafe_attribute', name, attributes[ name ] );
    }
  }
};


Model.prototype.get_attribute_names = function () {
  return this.constructor.attribute_names || [];
};