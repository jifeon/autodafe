var ProxyHandler = require('lib/proxy_handlers/proxy_handler');

module.exports = UserIdentityModelHandler.inherits( ProxyHandler );

function UserIdentityModelHandler( params ) {
  this._init( params );
}


UserIdentityModelHandler.prototype._init = function( params ) {
  this.super_._init( params );

  this.user_identity = params.user_identity;
  this.user_rights   = this.target.constructor.user_rights || {};
  if ( !this.user_rights.attributes ) this.user_rights.attributes = {};

  this.methods = [ 'get_attribute', 'set_attribute', 'save', 'remove' ];
};


UserIdentityModelHandler.prototype.get = function ( receiver, name ) {
  var self = this;

  if ( name in this.methods ) return function() {
    return self[ name ].apply( self, arguments );
  }

  return this.super_.get( receiver, name );
};


UserIdentityModelHandler.prototype.get_attribute = function ( name ) {
  var roles = this.user_identity.get_roles( this.target, name );
  var self  = this;

  if ( roles.some( function( role ) {
    return self._has_right( 'view', name, role );
  } ) )
    return this.target.get_attribute( name );

  this.user_identity.app.log(
    'Access denied to view attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );
  return null;
};


UserIdentityModelHandler.prototype.set_attribute = function ( name, value ) {
  var roles = this.user_identity.get_roles( this.target, name );
  var self  = this;

  if ( roles.some( function( role ) {
    return self._has_right( 'edit', name, role );
  } ) )
    return this.target.set_attribute( name, value );

  this.user_identity.app.log(
    'Access denied to edit attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );
  return null;
};


UserIdentityModelHandler.prototype.save = function ( attributes ) {
  if ( !this.target.is_new ) return this.target.save( attributes );

  var roles = this.user_identity.get_roles( this.target );
  var self  = this;

  if ( roles.some( function( role ) {
    return self._has_right( 'create', null, role );
  } ) )
    return this.target.save( attributes );

  return new Error( 'Access denied to create model `%s`'.format( this.target.class_name ) );
};


UserIdentityModelHandler.prototype.remove = function () {
  if ( this.target.is_new ) return this.target.remove();

  var roles = this.user_identity.get_roles( this.target );
  var self  = this;

  if ( roles.some( function( role ) {
    return self._has_right( 'remove', null, role );
  } ) )
    return this.target.remove();

  return new Error( 'Access denied to remove model `%s`'.format( this.target.class_name ) );
};


UserIdentityModelHandler.prototype._has_right = function ( right, attribute_name, role ) {
  var rights_map = right != 'create' && right != 'delete' &&
                   this.user_rights.attributes[ attribute_name ] &&
                   this.user_rights.attributes[ attribute_name ][ role ] ||
                   this.user_rights[ role ] ||
                   this.user_identity.users_manager.default_possibilities[ role ] ||
                   [];

  return ~rights_map.indexOf( right );
};