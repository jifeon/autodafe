var Component = require('components/component');

var LogRouter = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( LogRouter, Component );


LogRouter.prototype._init = function( params ) {
  Component.prototype._init.call( this, params );

  this.routes = {};

  var routes = params.routes || {};
  for ( var route_type in routes ) {
    var route_class;
    switch ( route_type ) {
      case 'console': route_class = require('./console_route'); break;
      case 'file':    route_class = require('./file_route');    break;
      default:        route_class = require('./log_route');     break;
    }

    this.routes[ route_type ] = new route_class( routes[ route_type ] );
  }
};


LogRouter.prototype.get_route = function ( route_type ) {
  return this.routes[ route_type ] || null;
};