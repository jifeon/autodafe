var Controller  = require('./controller');
var AppModule   = require('app_module');
var fs          = require('fs');
var path        = require('path');


module.exports = Router.inherits( AppModule );

function Router( params ) {
  this._init( params );
}


Router.prototype._init = function ( params ) {
  this.super_._init( params );

  this._rules               = params.rules || {};
  this._controllers         = {};

  this._collect_controllers();
};


Router.prototype._collect_controllers = function () {
  var controllers_path = path.join( this.app.base_dir, this.app.controllers_folder );
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


Router.prototype.route = function ( route_path ) {
  this.log( 'Route to `%s`'.format( route_path ? route_path : 'default controller with default action' ), 'trace' );

  var args = Array.prototype.splice.call( arguments, 1 );
  this._get_actions( route_path ).for_each( function( action ){
    var controller = this._controllers[ action.controller_name ];
    if ( !controller ) throw new Error(
      'Controller or rule "%s" is not found'.format( action.controller_name )
    );
    args.unshift( action.action );
    controller.run_action.apply( controller, args )
    args.shift();
  }, this );
};


Router.prototype._get_actions = function ( route_path ) {
  if ( !route_path ) return [{
    controller_name : this.app.default_controller,
    action          : null
  }];

  if ( this._rules )                  route_path = this._rules[ route_path ] || route_path;
  if ( !Array.isArray( route_path ) ) route_path = [ route_path ];

  return route_path.map( function( path ){
    var route_rule = path.split('.');

    if ( !route_rule.length ) throw new Error(
      'Incorrect route path: "%s". Route path should be formatted as controller.action \
       or specified in router.rules section of configuration file.'.format( route_path )
    );

    return {
      controller_name : route_rule[0],
      action          : route_rule[1] || null
    };
  }, this );
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};


Router.prototype.get_controllers = function () {
  return Object.not_deep_clone( this._controllers );
};