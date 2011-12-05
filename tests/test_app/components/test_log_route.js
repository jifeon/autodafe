var LogRoute = require('../../../framework/logging/log_route');

module.exports = TestLogRoute.inherits( LogRoute );

function TestLogRoute( params ) {
  this._init( params );
}


TestLogRoute.prototype._init = function( params ) {
  this.super_._init( params );
};


TestLogRoute.prototype.log_message = function ( message ) {
  this.emit( 'message', message );
};


TestLogRoute.prototype.grep_messages = function ( fun, args, context ) {
  var messages = [];
  var listener = function( message ) {
    messages.push( message );
  };

  this.on( 'message', listener );

  fun.apply( context || null, args || [] );

  this.removeListener( 'message', listener );

  return messages;
};


TestLogRoute.prototype.get_first_message = function () {
  return this.grep_messages.apply( this, arguments )[0] || null;
};