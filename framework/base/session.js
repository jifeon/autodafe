var AppModule = global.autodafe.AppModule;

module.exports = Session.inherits( AppModule );

function Session( params ) {
  this._init( params );
}


Session.prototype._init = function( params ) {
  Session.parent._init.call( this, params );

  if ( typeof params.id == 'undefined' )
    throw new Error( 'Try to create session without id' );

  this._.id         = params.id;
  this._.clients    = [];
  this._.is_active  = true;
  this._.secret     = String.unique();

  this.live_time      = params.live_time || 60000; // 1 min
  this.remove_timeout = null;
};


Session.prototype.add_client = function ( client ) {
  if ( this.remove_timeout ) {
    clearTimeout( this.remove_timeout );
    this.remove_timeout = null;
  }

  if ( ~this.clients.indexOf( client ) ) {
    this.log( 'Try to add duplicate client', 'warning' );
    return false;
  }

  this.clients.push( client );

  var self = this;
  client.once( 'disconnect', function(){
    self.remove_client( client );
  } );

  return true;
};


Session.prototype.remove_client = function ( client ) {
  var cid = this.clients.indexOf( client );
  if ( cid == -1 ) return;

  this.clients.splice( cid, 1 );
  
  if ( !this.clients.length ) this.remove_timeout = setTimeout( this.close.bind( this ), this.live_time );
};


Session.prototype.close = function () {
  this._.is_active = false;
  this.emit( 'close' );
};