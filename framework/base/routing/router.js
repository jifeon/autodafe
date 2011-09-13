var Controller  = require('controller.js');
var AppModule   = require('app_module');
var Route       = require('routing/route_path');
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
      path : rules[ rule ],
      app  : this.app
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

  if ( !route ) this.throw_error( 'Route `%s` is not found in section router.rules of configuration file'.format( route_path ) );


  route_path = ( matches[2]

  this.log( 'Route to `%s`'.format( route_path ? route_path : 'default controller with default action' ), 'trace' );

  var emitter         = new process.EventEmitter;
  var emitted_actions = 0;

  var args = Array.prototype.splice.call( arguments, 2 );
  this._get_actions( route_path, method ).for_each( function( action ){


    args.unshift( action.action );
    var res = controller.run_action.apply( controller, args )
    args.shift();

    if ( res instanceof process.EventEmitter ) {
      emitted_actions++;
      res
        .on( 'success', function() {
          if ( !--emitted_actions ) emitter.emit( 'success' );
        } )
        .on( 'error', function() {
          emitter.emit( 'error' );
        } );
    }
  }, this );

  if ( !emitted_actions ) process.nextTick( function() {
    emitter.emit( 'success' );
  } );

  return emitter;
};


Router.prototype._get_actions = function ( route_path, method ) {
  if ( !route_path ) return [{
    controller_name : this.app.default_controller,
    action          : null
  }];

//  if ( this._rules )                  route_path = this._rules[ route_path ] || route_path;

  if ( this._rules ){
    var _rules = {};
    var _route_path = route_path;
    for( var m in this._rules ){
      _rules[ m.toLowerCase() ] = this._rules[ m ];
      if( Object.isEmpty( route_path ) || route_path == _route_path )
        route_path = this._rules[ m ][ _route_path ];
    }
    if( Object.isEmpty( route_path ) ) route_path = _route_path;

    if( _rules[ 'post' ] ){
    var is_post_action = _rules[ 'post' ][ _route_path ] || false;
      if( method.toLowerCase() != 'post' && is_post_action ){
        var error =  new Error( '"POST" method expected' );
        error.number = 403;
        throw error;
      }
    }
  }

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