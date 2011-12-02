var ProxyHandler = require('lib/proxy_handlers/proxy_handler');

module.exports = UserIdentityModelHandler.inherits( ProxyHandler );

function UserIdentityModelHandler( params ) {
  this._init( params );
}


UserIdentityModelHandler.prototype._init = function( params ) {
  this.super_._init( params );

  this.user_identity = params.user_identity;
  this.params        = params.params;

  this.methods = [
    'get_attribute',
    'set_attribute',
    'get_attributes',
    'set_attributes',
    'save',
    'remove',
    'release'
  ];

  var self      = this;
  var accessor  = null;
  this.__defineGetter__( 'accessor', function(){
    if ( accessor ) return accessor;

    var handler = new ProxyHandler({
      target : {}
    });

    handler.get = function( reciever, name ){
      return self.user_identity.can( name, self.target, null, self.params );
    }

    accessor = handler.get_proxy();
    return accessor;
  } );
};


UserIdentityModelHandler.prototype.access_rights_methods = {
  'can_be_viewed'   : function() { return this.user_identity.can( 'view',   this.target, null, this.params ); },
  'can_be_edited'   : function() { return this.user_identity.can( 'edit',   this.target, null, this.params ); },
  'can_be_removed'  : function() { return this.user_identity.can( 'remove', this.target, null, this.params ); },
  'can_be_created'  : function() { return this.user_identity.can( 'create', this.target, null, this.params ); }
};


UserIdentityModelHandler.prototype.get = function ( receiver, name ) {
  var self = this;

  if ( ~this.methods.indexOf( name ) ) return function() {
    return self[ name ].apply( self, arguments );
  }

  if ( this._has_attribute( name ) )
    return this.get_attribute( name );

  if ( this.access_rights_methods[ name ] )
    return this.access_rights_methods[ name ].call( this );

  if ( name == 'is_permitted_for' ) return this.accessor;

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
  if ( this.user_identity.can( 'view', this.target, name, this.params ) )
    return this.target.get_attribute( name );

  this.user_identity.app.log(
    'Permission denied to view attribute `%s` in model `%s`'.format( name, this.target.class_name ), 'warning'
  );
  return null;
};


UserIdentityModelHandler.prototype.set_attribute = function ( name, value ) {
  if ( this.user_identity.can( 'edit', this.target, name, this.params ) )
    return this.target.set_attribute( name, value );

  this.target.validator.errors.push(
    'Permission denied to change `%s`'.format( name )
  );

  return null;
};


UserIdentityModelHandler.prototype.get_attributes = function ( names ) {
  var attributes = this.target.get_attributes( names );

  for ( var name in attributes )
    if ( !this.user_identity.can( 'view', this.target, name, this.params ) )
      attributes[ name ] = null;

  return attributes;
};


UserIdentityModelHandler.prototype.set_attributes = function ( attributes ) {
  var attrs = {};

  for ( var name in attributes )
    if ( this.user_identity.can( 'edit', this.target, name, this.params ) )
      attrs[ name ] = attributes[ name ];
    else this.target.validator.errors.push( 'Permission denied to change `%s`'.format( name ) );

  this.target.set_attributes( attrs );
};


UserIdentityModelHandler.prototype.save = function ( attributes, scenario ) {
  var action = this.target.is_new ? 'create' : 'edit';
  if ( !this.user_identity.can( action, this.model, null, this.params ) )
    this.target.validator.errors.push( 'Permission denied to %s model `%s`'.format( action, this.target.class_name ) );

  return this.target.save( attributes, scenario );
};


UserIdentityModelHandler.prototype.remove = function () {
  if ( this.user_identity.can( 'remove', this.target, null, this.params ) )
    return this.target.remove();

  return new Error( 'Permission denied to remove model `%s`'.format( this.target.class_name ) );
};


UserIdentityModelHandler.prototype.release = function () {
  return this.target;
};