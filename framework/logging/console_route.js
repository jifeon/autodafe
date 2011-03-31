var LogRoute = require('./log_route');

module.exports = ConsoleRoute.inherits( LogRoute );

function ConsoleRoute( params ) {
  this._init( params );
}


ConsoleRoute.prototype._init = function( params ) {
  require('./color/colors');

  this.__level2style = {};
  this.__level2style[ 'trace' ]   = 'italic';
  this.__level2style[ 'info' ]    = 'blue';
  this.__level2style[ 'warning' ] = 'magenta';
  this.__level2style[ 'error' ]   = 'red';

  this.super_._init( params );
};


ConsoleRoute.prototype.on_log = function ( message ) {
  console.log( this._format( message ) );
};


ConsoleRoute.prototype._format = function ( message ) {
  var text = LogRoute.prototype._format.call( this, message );
  return text[ this.__level2style[ message.level ] ];
};