var ProxyHandler = require('lib/proxy_handlers/proxy_handler');

module.exports = UserIdentityModelHandler.inherits( ProxyHandler );

function UserIdentityModelHandler( params ) {
  this._init( params );
}


UserIdentityModelHandler.prototype._init = function( params ) {
  this.super_._init( params );

  this.user_identity = params.user_identity;

  this.methods = [
    'get_attribute',
    'set_attribute',
    'get_attributes',
    'set_attributes',
    'save',
    'remove',
    'release'
  ];
};


UserIdentityModelHandler.prototype.get = function ( receiver, name ) {
  var self = this;

  if ( ~this.methods.indexOf( name ) ) return function() {
    return self[ name ].apply( self, arguments );
  }

  if ( this._has_attribute( name ) )
    return this.get_attribute( name );

  return this.super_.get( receiver, name );
};


UserIdentityModelHandler.prototype.set = function ( receiver, name, value ) {
  if ( this._has_attribute( name ) )
    return this.set_attribute( name, value );

  return this.super_.set( receiver, name, value );
};


UserIdentityModelHandler.prototype._has_attribute = function ( name ) {
  return this.target.get_attributes()[ name ];
};


UserIdentityModelHandler.prototype.get_attribute = function ( name ) {
  if ( this.user_identity.can( 'view', this.target, name ) )
    return this.target.get_attribute( name );

  this.user_identity.app.log(
    'Permission denied to view attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );
  return null;
};


UserIdentityModelHandler.prototype.set_attribute = function ( name, value ) {
  if ( this.user_identity.can( 'edit', this.target, name ) )
    return this.target.set_attribute( name, value );

  this.target.validator.errors.push(
    'Permission denied to change `%s`'.format( name )
  );

  return null;
};


UserIdentityModelHandler.prototype.get_attributes = function ( names ) {
  var attributes = this.target.get_attributes( names );

  for ( var name in attributes )
    if ( !this.user_identity.can( 'view', this.target, name ) )
      attributes[ name ] = null;

  return attributes;
};


UserIdentityModelHandler.prototype.set_attributes = function ( attributes ) {
  var attrs = {};

  for ( var name in attributes )
    if ( this.user_identity.can( 'edit', this.target, name ) )
      attrs[ name ] = attributes[ name ];
    else this.target.validator.errors.push( 'Permission denied to change `%s`'.format( name ) );

  this.target.set_attributes( attrs );
};


UserIdentityModelHandler.prototype.save = function ( attributes, scenario ) {
  var action = this.target.is_new ? 'create' : 'edit';
  if ( !this.user_identity.can( action, this.model ) )
    this.target.validator.errors.push( 'Permission denied to %s model `%s`'.format( action, this.target.class_name ) );

  return this.target.save( attributes, scenario );
};


UserIdentityModelHandler.prototype.remove = function () {
  if ( this.user_identity.cal( 'remove', this.target ) )
    return this.target.remove();

  return new Error( 'Permission denied to remove model `%s`'.format( this.target.class_name ) );
};


UserIdentityModelHandler.prototype.release = function () {
  return this.target;
};