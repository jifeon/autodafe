var Controller  = require('controller.js');
var AppModule   = require('app_module');
var Route       = require('routing/route');
var fs          = require('fs');
var path        = require('path');


module.exports = Router.inherits( AppModule );

function Router( params ) {
  this._init( params );
}


Router.prototype._init = function ( params ) {
  this.super_._init( params );

  this._routes         = {};
  this._rules          = {};
  this._controllers    = {};

  this._collect_controllers();
  this._parse_route_paths( params.rules );
};


Router.prototype._parse_route_paths = function ( rules ) {
  for ( var rule in rules ) {
    var route = new Route( {
      path    : rules[ rule ],
      app     : this.app,
      router  : this
    } );

    this._routes[ rule ] = route;
    this._rules[ route.path ] = rule;
  }
};


Router.prototype._collect_controllers = function () {
  var controllers_path = this.app.path_to_controllers;
  this.log( 'Collecting controllers in path: ' + controllers_path, 'trace' );

  var files = fs.readdirSync( controllers_path );
  for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {

    try {
      var file        = files[f];
      var file_path   = path.join( controllers_path, file );
      var stat        = fs.statSync( file_path );

      if ( !stat.isFile() ) continue;

      var controller_class = require( file_path );
    }
    catch( e ) {
      this.log( e, 'warning' );
      continue;
    }

    if ( !Controller.is_instantiate( controller_class.prototype ) ) {
      this.log( 'File in path `%s` is not a controller'.format( file_path ), 'warning' );
      continue;
    }

    var name = path.basename( file_path, '.js' );

    this.log( 'Controller "%s" is added'.format( name ), 'trace' );
    this._controllers[ name ] = new controller_class({
      app   : this.app,
      name  : name
    });
  }

  this.log( 'Controllers are included', 'info' );
};


Router.prototype.throw_error = function ( message, number ) {
  var error =  new Error( message );
  error.number = number || 404;
  throw error;
};


Router.prototype.route = function ( route_rule, params, client, connection_type ) {
  var route       = this._routes[ route_rule ];
  if ( !route )
      this.throw_error( 'Route `%s` is not found in section router.rules of configuration file'.format( route_rule ) );

  var controller  = this._controllers[ route.controller ];
  if ( !controller ) this.throw_error( 'Controller "%s" is not found'.format( route.controller ) );

  if ( !route.is_allowed_con_type( connection_type ) )
    this.throw_error( 'Route `%s` is not allowed for connection type `%s`'.format( route.path, connection_type ), 403 );

  this.log( 'Route to `%s`'.format( route.path ), 'trace' );

  try {
    return controller.run_action( route.action, params, client );
  }
  catch ( e ) {
    e.number = 404;
    throw e;
  }
};


Router.prototype.get_rule = function ( route_path ) {
  var rule = this._rules[ route_path ];
  return rule == null ? route_path : rule;
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};