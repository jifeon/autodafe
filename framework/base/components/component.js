var AppModule = require('app_module');

module.exports = Component.inherits( AppModule );

function Component( params ) {
  this._init( params );
}


Component.prototype._init = function( params ) {
  this.super_._init( params );

  this.name = params.name;

  this._define_getter();
};


Component.prototype._define_getter = function () {
  var self = this;
  this.app.__defineGetter__( this.name, function() {
    return self;
  } );
};


