var AppModule = require('app_module');

module.exports = UserIdentity.inherits( AppModule );

function UserIdentity( params ) {
  return this._init( params );
}


UserIdentity.prototype._init = function( params ) {
  this.super_._init( params );
  var self = this;

  var Session = require('session');
  if ( !Session.is_instantiate( params.session ) )
    throw new Error( '`session` should be instance of Session in UserIdentity._init' );

  this.session    = params.session;
  this.id         = null;
  this.users_map  = Object.isObject( params.users_map ) ? params.users_map : {};

  this._.is_guest     = true;
  this._.is_guest.get = function() {
    return self.id == null;
  }

  this._.similar_users = [ this ];
  this._.all_clients   = [ this.session.client ];
};


UserIdentity.prototype.authorize = function ( id ) {
  if ( id == null ) return false;

  this.id       = id;

  var self      = this;
  var users_map = this.users_map;

  this._.similar_users.get = function() {
    return Object.values( users_map[ self.id ] );
  }

  this._.all_clients.get = function() {
    return self.similar_users.map( function( user ) {
      return user.session.client;
    } );
  }

  return true;
};


UserIdentity.prototype.send = function ( data ) {
  this.session.client.send( data );
};


UserIdentity.prototype.send_to_all_clients = function ( data, filter ) {
  var users = filter ? this.similar_users.filter( filter ) : this.similar_users;
  users.for_each( this.send, null, data );
};


UserIdentity.prototype.broadcast = function ( data, filter ) {
  this.app.users.for_each(  );
};