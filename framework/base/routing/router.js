var Controller  = global.autodafe.Controller;
var AppModule   = global.autodafe.AppModule;
var Route       = require('./route');
var fs          = require('fs');
var path        = require('path');
var qs          = require('querystring');


module.exports = Router.inherits( AppModule );

function Router( params ) {
  this._init( params );
}


Router.prototype._init = function ( params ) {
  Router.parent._init.call( this, params );

  this._routes         = [];
  this._routes_by_path = {};
  this._controllers    = {};

  this._collect_controllers();
  this._parse_route_paths( params.rules );
};


Router.prototype._parse_route_paths = function ( rules ) {
  for ( var rule in rules ) {
    var route = new Route( {
      path    : rules[ rule ],
      rule    : rule,
      app     : this.app,
      router  : this
    } );

    this._routes.push( route );
    var route_path = route.path;
    if ( !this._routes_by_path[ route_path ] ) this._routes_by_path[ route_path ] = [];
    this._routes_by_path[ route.path ].push( route );
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
      this.log( 'Problem while including controller in path `%s`'.format( file_path ), 'warning' );
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


Router.prototype.route = function ( query ) {

  if ( !this._routes.some( function( route ){
    return route.is_suitable_for( query, true );
  } ) )
    this.throw_error( ('Route to `{route_rule}` failed. ' +
      'File not found and route not specified in section router.rules of configuration file or ' +
      'specified for other protocol or query type than `{current_ct}`').format( {
        '{route_rule}' : query.action,
        '{current_ct}' : query.connection_type
      } )
    );

  var route       = query.route;
  var controller  = this._controllers[ route.controller ];
  if ( !controller ) this.throw_error( 'Controller "%s" is not found'.format( route.controller ) );

  this.log( 'Route to `%s`'.format( route.path ), 'trace' );

  try {
    return controller.run_action( route.action, query.params, query.client );
  }
  catch ( e ) {
    e.number = 404;
    throw e;
  }
};


Router.prototype.create_url = function ( route_path, params, default_controller, default_action ) {
  var matches = /^(((\w+)\.)?(\w+))?$/.exec( route_path );
  if ( !matches ) return route_path || '#';

  var controller_name = matches[3] || default_controller;
  var action_name     = matches[4] || default_action;
  route_path          = controller_name + '.' + action_name;

  var routes  = this._routes_by_path[ route_path ];
  if ( !routes ) return route_path || '#';

  var route = routes.filter( function( route ){
    return route.has_params( params );
  } ).sort( function( a, b ){
    return Object.keys( a.rule_params ).length < Object.keys( b.rule_params ).length;
  } )[0];
  if ( !route ) return '';

  var rule  = route.get_rule( params );
  var query = qs.stringify( params );

  return '/' + rule + ( query ? '?' + query : '' );
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};