var Component = global.autodafe.Component;

module.exports = LogRouter.inherits( Component );

function LogRouter( params ) {
  this._init( params );
}


LogRouter.prototype._init = function( params ) {
  LogRouter.parent._init.call( this, params );

  this.routes = {};

  var routes = params.routes || {};
  for ( var route_type in routes ) {
    var route_class_name = route_type + '_log_route';
    var route_class;

    try {
      route_class = require('./' + route_class_name );
    }
    catch( e ) {
      route_class = this.app.components.get_user_component( route_class_name );
    }

    if ( !route_class ) {
      this.log( 'Unknown route type: ' + route_type, 'warning' );
      continue;
    }

    var route_params = routes[ route_type ] || {};
    route_params.app = this.app;

    this.routes[ route_type ] = new route_class( route_params );
  }
};


LogRouter.prototype.get_route = function ( route_type ) {
  return this.routes[ route_type ] || null;
};