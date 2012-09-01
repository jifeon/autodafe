module.exports = Good.inherits( global.autodafe.Controller );

function Good( params ) {
  this._init( params );
}


Good.prototype.before_action = function ( action, response, request ) {
  this.emit( 'action', action, request.params );
};


Good.prototype.index          = function () {};
Good.prototype.action         = function () {};
Good.prototype.remove         = function () {};
Good.prototype.domain_index   = function () {};
Good.prototype.domain_action  = function () {};

Good.prototype.bad_action = function () {
  throw new Error;
};