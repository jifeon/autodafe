var UserIdentityModelHandler = require('./user_identity_model_handler');

module.exports = UserIdentityARHandler.inherits( UserIdentityModelHandler );

function UserIdentityARHandler( params ) {
  this._init( params );
}


UserIdentityARHandler.prototype._init = function ( params ) {
  this.super_._init( params );

  var ui = this.user_identity;
  this.target.substitute_related_records( ui.manage.bind( ui ) );
//  this.methods.push(  );
};


UserIdentityARHandler.prototype.save = function ( attributes, scenario ) {
  var res = this.super_.save( attributes, scenario );
  if ( res instanceof Error ) {
    var emitter = new process.EventEmitter;
    process.nextTick( function() {
      emitter.emit( 'error', res );
    } );

    return emitter;
  }

  return res;
};


UserIdentityARHandler.prototype.remove = function () {
  var res = this.super_.remove();
  if ( res instanceof Error ) {
    var emitter = new process.EventEmitter;
    process.nextTick( function() {
      emitter.emit( 'error', res );
    } );

    return emitter;
  }

  return res;
};


UserIdentityARHandler.prototype.release = function () {
  return this._release_ar( this.target );
};


UserIdentityARHandler.prototype._release_ar = function ( ar ) {
  if ( Array.isArray( ar ) ) return ar.map( this._release_ar.bind( this ) );

  if ( typeof ar.release == 'function' ) {
    ar.substitute_related_records( this._release_ar.bind( this ) );

    return ar.release();
  }

  return ar;
};