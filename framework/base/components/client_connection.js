var Component = require('./component');
var Session   = require('session');

var ClientConnection = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( ClientConnection, Component );


ClientConnection.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );


};


ClientConnection.prototype._on_connect = function ( session_id ) {
  var session = new Session({
    id : session_id
  });
  
  this.app.emit( 'new_session', session, this );
  this.app.router.route( this.app.default_controller + '.client_connect', session.id );
};