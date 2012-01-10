var Controller  = global.autodafe.Controller;

module.exports = GoodController.inherits( Controller );

function GoodController( params ) {
  this._init( params );
}


GoodController.prototype.before_action = function ( action, params ) {
  this.emit( 'action', action, params );
};


GoodController.prototype.index          = function () {};
GoodController.prototype.action         = function () {};
GoodController.prototype.remove         = function () {};
GoodController.prototype.domain_index   = function () {};
GoodController.prototype.domain_action  = function () {};

GoodController.prototype.bad_action = function () {
  throw new Error;
};