var fs          = require('fs');
var Controller  = require('./controller');

var Router = module.exports = function( config ) {
  this._init( config );
};


Router.prototype._init = function ( config ) {
  this._config      = config || {};
  this._controllers = {};

  this.app = global.autodafe.app;

  this.collect_controllers();
};


Router.prototype.collect_controllers = function () {
  var controllers_dir = global.autodafe.app.base_dir + 'controllers/';
  this.app.log( 'Collecting controllers in path: ' + controllers_dir, 'trace' );

  try {

    var file;
    var files = fs.readdirSync( controllers_dir );
    for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {
      file      = files[f];
      var path  = controllers_dir + file;
      var stat  = fs.statSync( path );
      if ( !stat.isFile() ) {
        continue;
      }

      var controller = require( path );
      if ( !( controller.prototype instanceof Controller ) ) throw "NOT_CONTROLLER";

      var name = controller.prototype.name;
      if ( !name ) throw "NO_NAME";

      this.app.log( 'Controller "%s" is added'.format( name ), 'trace' );
      this._controllers[ name ] = new controller;
    }

  }
  catch( e ) {
    switch ( e ) {
      case 'NOT_CONTROLLER':
        this.app.log( '"%s" is not a controller'.format( file ), 'error', 'Router' );
        break;

      case 'NO_NAME':
        this.app.log( 'Controller has no property "name" in file "%s"'.format( file ), 'error', 'Router' );
        break;

      default:
        if ( file ) this.app.log( 'Error while including file "%s"'.format( file ), 'error', 'Router' );
        throw e;
        break;
    }
  }

  this.app.log( 'Controllers are included', 'info' );
};


Router.prototype.route = function ( route_path ) {
  this.app.log( 'route to ' + route_path, 'trace' );
  var args = Array.prototype.splice.call( arguments, 1 );

  var actions = [];

  if ( route_path ) {
    if ( this._config.rules ) {
      route_path = this._config.rules[ route_path ] || route_path;
    }

    if ( !( route_path instanceof Array ) ) route_path = [ route_path ];
    for ( var r = 0, r_ln = route_path.length; r < r_ln; r++ ) {
      var route_rule = route_path[ r ].split('.');

      if ( !route_rule.length )
      return this.app.log(
        'Incorrect route path: "%s". Route path must be formated as controller.action \
         or specified in router.rules section of config.'.format( route_path ), 'error', 'Router'
      );

      actions.push({
        controller_name : route_rule[0],
        action          : route_rule[1]
      });
    }
  }
  else {

    actions.push({
      controller_name : global.autodafe.app.default_controller,
      action          : null
    });
  }

  for ( var a = 0, a_ln = actions.length; a < a_ln; a++ ) {
    var action = actions[ a ];

    var controller    = this._controllers[ action.controller_name ];
    if ( !controller ) return this.app.log(
      'Controller or route rule "%s" is not found'.format( action.controller_name ), 'warning', 'Router'
    );

    controller.run_action( action.action, args );
  }
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};