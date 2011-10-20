var RolesSet = require('./roles_set');

module.exports = ModelsRolesSet.inherits( RolesSet );

function ModelsRolesSet( params ) {
  this._init( params );
}


ModelsRolesSet.prototype._init = function( params ) {
  if ( !RolesSet.is_instantiate( params.parent_set ) ) throw new Error(
    '`parent_set` should be instance of RolesSet in ModelsRolesSet._init'
  );
  this.parent_set   = params.parent_set;
  this.attrs_rights = {};

  this.super_._init( params );
};


ModelsRolesSet.prototype._init_roles = function ( params ) {
  this.roles = Object.clone( this.parent_set.roles );

  this.super_._init_roles( params );
};


ModelsRolesSet.prototype._init_roles_groups = function ( params ) {
  this.roles_groups = Object.clone( this.parent_set.roles_groups );

  for( var group in params.roles_groups ) {
    var roles_str   = params.roles_groups[ group ].trim();
    var modificate  = /[+\-]/.test( roles_str.charAt(0) );

    if ( !this.roles_groups[ group ] || !modificate ) this.roles_groups[ group ] = {};
    roles_str.split( ',' ).forEach( function( role ){
      role = role.trim();
      var role_in_group = true;

      var sign = role.charAt(0);
      if ( /[+\-]/.test( sign ) ) {
        role_in_group = sign == '+';
        role = role.substr(1);
      }

      if ( !this.roles[ role ] ) throw new Error( 'Unknown role `%s` in roles_groups'.format( role ) );
      this.roles_groups[ group ][ role ] = role_in_group;
    }, this );
  }
};


ModelsRolesSet.prototype._apply_rights = function ( params ) {
  this.roles_rights = Object.clone( this.parent_set.roles_rights );

  this.super_._apply_rights( params.model, this.roles_rights );

  for ( var attr_name in params.attributes ){
    this.attrs_rights[ attr_name ] = Object.clone( this.roles_rights );
    this.super_._apply_rights( params.attributes[ attr_name ], this.attrs_rights[ attr_name ] );
  }
};


ModelsRolesSet.prototype.check_right = function ( user_identity, action, model, attribute ) {
  var action_rights = attribute
    ? this.attrs_rights[ attribute ] && this.attrs_rights[ attribute ][ action ]
    : this.roles_rights[ action ];
  if ( !action_rights ) return false;

  var has_right = function( role ){
    return action_rights[ role ];
  }

  return this.get_roles( user_identity, model, attribute ).some( has_right );
};