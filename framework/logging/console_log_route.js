var LogRoute = require('./log_route');

module.exports = ConsoleLogRoute.inherits( LogRoute );

function ConsoleLogRoute( params ) {
  this._init( params );
}


ConsoleLogRoute.prototype._init = function( params ) {
  require('./color/colors');

  this._level2style = {
    info    : 'blue',
    warning : 'magenta',
    error   : 'red'
  };

  this.super_._init( params );
};


ConsoleLogRoute.prototype.log_message = function ( message ) {
  console.log( this._format( message ) );
  if ( message.level == 'error' && !message.stack ) console.trace();
};


ConsoleLogRoute.prototype._format = function ( message ) {
  var text  = this.super_._format( message );
  var style = this._level2style[ message.level ];

  return style ? text[ style ] : text;
};