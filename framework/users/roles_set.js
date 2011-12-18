var AppModule = global.autodafe.AppModule;

module.exports = RolesSet.inherits( AppModule );

function RolesSet( params ) {
  this._init( params );
}


RolesSet.prototype._init = function( params ) {
  RolesSet.parent._init.call( this, params );

  this.roles           = {};
  this.roles_groups    = {};
  this.roles_rights    = {};

  this._init_roles( params );
  this._apply_rights( params.rights || {}, this.roles_rights );
};


RolesSet.prototype._init_roles = function ( params ) {
  var self = this;

  this.roles.guest = function( user_model ) {
    return !user_model;
  };

  for ( var role in params.roles ) {
    var role_determinant = params.roles[ role ];

    switch ( typeof role_determinant ) {
      case 'function':
        this.roles[ role ] = role_determinant;
        break;

      case 'string':
        try {
          this.roles[ role ] = new Function(
            'user', 'app', 'model', 'attribute', 'params',
            'return ' + role_determinant
          );
        }
        catch ( e ) {
          throw new Error(
            'You have syntax error in users.role definition. Check your config file ( components.users.roles.%s )'.format( role )
          );
        }
        break;

      default : throw new Error(
        'Value of `components.users.roles.%s` hash in your config file should be Strings or Functions'.format( role )
      );
    }
  }

  this._init_roles_groups( params );
};


RolesSet.prototype._init_roles_groups = function ( params ) {
  for( var group in params.roles_groups ) {
    this.roles_groups[ group ] = {};
    params.roles_groups[ group ].split( ',' ).forEach( function( role ){
      role = role.trim();
      if ( !this.roles[ role ] ) throw new Error( 'Unknown role `%s` in roles_groups'.format( role ) );
      this.roles_groups[ group ][ role ] = true;
    }, this );
  }
};


RolesSet.prototype._apply_rights = function ( params, rights ) {
  if ( !params ) params = {};

  for( var action in params ) {
    var rights_str = params[ action ];
    var modificate = /[+\-]/.test( rights_str.charAt(0) );

    if ( !rights[ action ] || !modificate ) rights[ action ] = {};
    var action_rights = rights[ action ];

    rights_str.split( ',' ).forEach( function( role ){

      role = role.trim();
      var actions_possibility = true;

      var sign = role.charAt(0);
      if ( /[+\-]/.test( sign ) ) {
        actions_possibility = sign == '+';
        role = role.substr(1);
      }

      if ( !this.roles[ role ] ) {
        var roles = this.roles_groups[ role ];
        if ( !roles ) throw new Error( 'Unknown role or roles group `%s` in roles rights'.format( role ) );
        for ( role in roles ){
          action_rights[ role ] = actions_possibility;
        }
      }
      else action_rights[ role ] = actions_possibility;

    }, this );
  }
};


RolesSet.prototype.check_right = function ( user_identity, action, model, attribute, params ) {
  var action_rights = this.roles_rights[ action ];
  if ( !action_rights ) return false;

  var has_right = function( role ){
    return action_rights[ role ];
  }

  return this.get_roles( user_identity, model, attribute, params ).some( has_right );
};


RolesSet.prototype.get_roles = function ( user_identity, model, attribute, params ) {
  var roles = [];

  for ( var role in this.roles )
    try { // user_identity.model can be null
      if ( this.roles[ role ]( user_identity.model, this.app, model, attribute, params ) )
        roles.push( role );
    } catch(e) {}

  return roles;
};