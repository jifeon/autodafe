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
};


UserIdentityModelHandler.prototype.get = function ( receiver, name ) {
  var self = this;

  switch ( name ) {
    case 'get_attribute':
      return function( name ) {
        return self.get_attribute( name );
      }

    case 'set_attribute':
      return function( name, value ){
        return self.set_attribute( name, value );
      }

    default:
      return this.super_.get( receiver, name );
  }
};


UserIdentityModelHandler.prototype.get_attribute = function ( name ) {
  var roles = this.user_identity.get_roles( this.target, name );
  var self  = this;

  if ( roles.some( function( role ) {
    return self.has_right( 'view', name, role );
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
    return self.has_right( 'edit', name, role );
  } ) )
    return this.target.set_attribute( name, value );

  this.user_identity.app.log(
    'Access denied to edit attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );
  return null;
};


UserIdentityModelHandler.prototype.has_right = function ( right, attribute_name, role ) {
  var rights_map = this.user_rights.attributes[ attribute_name ] &&
                   this.user_rights.attributes[ attribute_name ][ role ] ||
                   this.user_rights[ role ] ||
                   this.user_identity.users_manager.default_possibilities[ role ] ||
                   [];

  return ~rights_map.indexOf( right );
};