var LogRoute = require('autodafe/framework/logging/log_route');

module.exports = TestLogRoute.inherits( LogRoute );

function TestLogRoute( params ) {
  this._init( params );
}


TestLogRoute.prototype.log_message = function ( message ) {
  this.emit( 'message', message );
};


TestLogRoute.prototype.grep_messages = function ( callback ) {
  var messages = [];
  var listener = function( message ) {
    messages.push( message );
  };

  this.on( 'message', listener );
  callback();
  this.removeListener( 'message', listener );

  return messages;
};


TestLogRoute.prototype.get_first_message = function ( callback ) {
  return this.grep_messages( callback )[0] || null;
};