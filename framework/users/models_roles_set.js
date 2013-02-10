var RolesSet = require('./roles_set');
var _ = require('underscore');

module.exports = ModelsRolesSet.inherits( RolesSet );

function ModelsRolesSet( params ) {
  this._init( params );
}


ModelsRolesSet.prototype._init = function( params ) {
  if (!params.parent_set) throw new Error(
    '`parent_set` should be instance of RolesSet in ModelsRolesSet._init'
  );
  this.parent_set   = params.parent_set;
  this.attrs_rights = {};

  ModelsRolesSet.parent._init.call( this, params );
};


ModelsRolesSet.prototype._init_roles = function ( params ) {
  this.roles = _.deep_clone( this.parent_set.roles );

  ModelsRolesSet.parent._init_roles.call( this, params );
};


ModelsRolesSet.prototype._init_roles_groups = function ( params ) {
  this.roles_groups = _.deep_clone(this.parent_set.roles_groups);

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
  this.roles_rights = _.deep_clone(this.parent_set.roles_rights);

  ModelsRolesSet.parent._apply_rights.call( this, params.model, this.roles_rights );

  for ( var attr_name in params.attributes ){
    this.attrs_rights[ attr_name ] = _.deep_clone(this.roles_rights);
    ModelsRolesSet.parent._apply_rights.call( this, params.attributes[ attr_name ], this.attrs_rights[ attr_name ] );
  }
};


ModelsRolesSet.prototype.check_right = function ( user_identity, action, model, attribute, params ) {
  var action_rights = attribute
    ? this.attrs_rights[ attribute ] && this.attrs_rights[ attribute ][ action ] || this.roles_rights[ action ]
    : this.roles_rights[ action ];
  if ( !action_rights ) return false;

  var has_right = function( role ){
    return action_rights[ role ];
  }

  return this.get_roles( user_identity, model, attribute, params ).some( has_right );
};