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
    
    this._routes[ route.path ] = route;
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


Router.prototype.route = function ( route_path, params, client, connection_type ) {
  var matches = /^((\w+)(\.(\w+))?)?$/.exec( route_path );
  if ( !matches ) this.throw_error(
    'Incorrect route path: "%s". Route path should be formatted as controller.action'.format( route_path )
  );

  var controller_name = matches[2] || this.app.default_controller;
  var controller      = this._controllers[ controller_name ];

  if ( !controller ) this.throw_error( 'Controller "%s" is not found'.format( controller_name ) );

  var action_name     = matches[4] || controller.default_action;
  route_path          = controller_name + '.' + action_name;
  var route           = this._routes[ route_path ];

  if ( !route )
    this.throw_error( 'Route `%s` is not found in section router.rules of configuration file'.format( route_path ) );

  if ( !route.is_allowed_con_type( connection_type ) )
    this.throw_error( 'Route `%s` is not allowed for connection type `%s`'.format( route_path, connection_type ), 403 );

  this.log( 'Route to `%s`'.format( route_path ), 'trace' );

  try {
    return controller.run_action( action_name, params, client );
  }
  catch ( e ) {
    e.number = 404;
    throw e;
  }
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};