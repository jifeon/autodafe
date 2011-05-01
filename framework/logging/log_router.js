var Component = require('components/component');

module.exports = LogRouter.inherits( Component );

function LogRouter( params ) {
  this._init( params );
}


LogRouter.prototype._init = function( params ) {
  this.super_._init( params );

  this.routes = {};

  var routes = params.routes || {};
  for ( var route_type in routes ) {
    var route_class;
    switch ( route_type ) {
      case 'console': route_class = require('./console_route'); break;
      case 'file':    route_class = require('./file_route');    break;
      case 'mail':    route_class = require('./mail_route');    break;
      default:        route_class = require('./log_route');     break;
    }

    var route_params = routes[ route_type ] || {};
    route_params.app = this.app;

    this.routes[ route_type ] = new route_class( routes[ route_type ] );
  }
};


LogRouter.prototype.get_route = function ( route_type ) {
  return this.routes[ route_type ] || null;
};