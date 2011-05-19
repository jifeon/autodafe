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
  this._controllers_folder  = 'controllers';

  this._collect_controllers();
};


Router.prototype._collect_controllers = function () {
  var controllers_dir = path.join( this.app.base_dir, this._controllers_folder );
  this.log( 'Collecting controllers in path: ' + controllers_dir, 'trace' );

  var file;
  var files = fs.readdirSync( controllers_dir );
  for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {

    try {
      file            = files[f];
      var file_path   = path.join( controllers_dir, file );
      var stat        = fs.statSync( file_path );

      if ( !stat.isFile() ) {
        continue;
      }

      var controller = require( file_path );
      if ( !( controller.prototype instanceof Controller ) ) throw "NOT_CONTROLLER";

      var name = path.basename( file_path, '.js' );

      this.log( 'Controller "%s" is added'.format( name ), 'trace' );
      this._controllers[ name ] = new controller({
        app   : this.app,
        name  : name
      });
    }

    catch( e ) {
      switch ( e ) {
        case 'NOT_CONTROLLER':
          this.log( '"%s" is not a controller'.format( file ), 'error' );
          break;

        default:
          if ( file ) this.log( 'Error while including file "%s"'.format( file ), 'error' );
          break;
      }
    }
  }

  this.log( 'Controllers are included', 'info' );
};


Router.prototype.route = function ( route_path ) {
  this.log( 'route to ' + route_path, 'trace' );
  var args = Array.prototype.splice.call( arguments, 1 );

  var actions = [];

  if ( route_path ) {
    if ( this._rules ) {
      route_path = this._rules[ route_path ] || route_path;
    }

    if ( !( route_path instanceof Array ) ) route_path = [ route_path ];
    for ( var r = 0, r_ln = route_path.length; r < r_ln; r++ ) {
      var route_rule = route_path[ r ].split('.');

      if ( !route_rule.length )
        return this.log(
          'Incorrect route path: "%s". Route path must be formated as controller.action \
           or specified in router.rules section of config.'.format( route_path ), 'error'
        );

      actions.push({
        controller_name : route_rule[0],
        action          : route_rule[1]
      });
    }
  }
  else {

    actions.push({
      controller_name : this.app.default_controller,
      action          : null
    });
  }

  for ( var a = 0, a_ln = actions.length; a < a_ln; a++ ) {
    var action = actions[ a ];

    var controller    = this._controllers[ action.controller_name ];
    if ( !controller ) return this.log(
      'Controller or route rule "%s" is not found'.format( action.controller_name ), 'warning'
    );

    args.unshift( action.action );
    try {
      controller.run_action.apply( controller, args )
    } catch ( e ) {
      this.log( e );
      break;
    }
    args.shift();
  }
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};


Router.prototype.get_controllers = function () {
  return this._controllers;
};