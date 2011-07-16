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

  this.methods = [
    'get_attribute',
    'set_attribute',
    'get_attributes',
    'set_attributes',
    'save',
    'remove'
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
  var roles = this.user_identity.get_roles( this.target, name );
  var self  = this;

  var has_view_right = function( role ) {
    return this._has_right( 'view', name, role );
  }

  if ( this.user_identity.get_roles( this.target, name ).some( has_view_right, this ) )
    return this.target.get_attribute( name );

  this.user_identity.app.log(
    'Access denied to view attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );
  return null;
};


UserIdentityModelHandler.prototype.set_attribute = function ( name, value ) {
  var has_edit_right = function( role ) {
    return this._has_right( 'edit', name, role );
  }

  if ( this.user_identity.get_roles( this.target, name ).some( has_edit_right, this ) )
    return this.target.set_attribute( name, value );

  this.user_identity.app.log(
    'Access denied to edit attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );

  return null;
};


UserIdentityModelHandler.prototype.get_attributes = function ( names ) {
  var attributes = this.target.get_attributes( names );

  var name;
  var has_view_right = function( role ) {
    return this._has_right( 'view', name, role );
  }

  for ( name in attributes )
    if ( !this.user_identity.get_roles( this.target, name ).some( has_view_right, this ) )
      attributes[ name ] = null;

  return attributes;
};


UserIdentityModelHandler.prototype.set_attributes = function ( attributes ) {
  var attrs = {};
  var name;

  var has_edit_right = function( role ) {
    return this._has_right( 'edit', name, role );
  }

  for ( name in attributes )
    if ( this.user_identity.get_roles( this.target, name ).some( has_edit_right, this ) )
      attrs[ name ] = attributes[ name ];

  this.target.set_attributes( attrs );
};


UserIdentityModelHandler.prototype.save = function ( attributes, scenario ) {
  if ( !this.target.is_new ) return this.target.save( attributes, scenario );

  var roles = this.user_identity.get_roles( this.target );
  var self  = this;

  if ( roles.some( function( role ) {
    return self._has_right( 'create', null, role );
  } ) )
    return this.target.save( attributes, scenario );

  return new Error( 'Access denied to create model `%s`'.format( this.target.class_name ) );
};


UserIdentityModelHandler.prototype.remove = function () {
  var roles = this.user_identity.get_roles( this.target );
  var self  = this;

  if ( roles.some( function( role ) {
    return self._has_right( 'remove', null, role );
  } ) )
    return this.target.remove();

  return new Error( 'Access denied to remove model `%s`'.format( this.target.class_name ) );
};


UserIdentityModelHandler.prototype._has_right = function ( right, attribute_name, role ) {
  var rights_map = right != 'create' && right != 'remove' &&
                   this.user_rights.attributes[ attribute_name ] &&
                   this.user_rights.attributes[ attribute_name ][ role ] ||
                   this.user_rights[ role ] ||
                   this.user_identity.users_manager.default_possibilities[ role ] ||
                   [];

  return ~rights_map.indexOf( right );
};