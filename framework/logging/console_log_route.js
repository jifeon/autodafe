var LogRoute = require('./log_route');

module.exports = ConsoleLogRoute.inherits( LogRoute );

function ConsoleLogRoute( params ) {
  this._init( params );
}


ConsoleLogRoute.prototype._init = function( params ) {
  require('colors');

  this._level2style = {
    info    : 'blue',
    warning : 'magenta',
    error   : 'red'
  };

  ConsoleLogRoute.parent._init.call( this, params );
};


ConsoleLogRoute.prototype.log_message = function ( message ) {
  console.log( this._format( message ) );
  if ( message.level == 'error' && !message.stack ) console.trace();
};


ConsoleLogRoute.prototype._format = function ( message ) {
  var text  = ConsoleLogRoute.parent._format.call( this, message );
  var style = this._level2style[ message.level ];

  return style ? text[ style ] : text;
};