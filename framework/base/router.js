var fs          = require('fs');
var Controller  = require('./controller');

var Router = module.exports = function( config ) {
  this._init( config );
};


Router.prototype._init = function ( config ) {
  this._config      = config || {};
  this._controllers = {};

  this.app = this._config.application;
  if ( !this.app ) throw new Error( 'app is null in Router.init' );

  this.collect_controllers();
};


Router.prototype.collect_controllers = function () {
  var controllers_dir = this.app.get_base_dir() + 'controllers/';
  console.log( 'collecting controllers in path: ' + controllers_dir );

  var files = fs.readdirSync( controllers_dir );
  for ( var f = 0, f_ln = files.length; f < f_ln; f++ ) {
    var file = files[f];
    try {
      var path = controllers_dir + file;
      var stat = fs.statSync( path );
      if ( !stat.isFile() ) {
        continue;
      }

      var controller = require( path );
      if ( !( controller.prototype instanceof Controller ) ) throw "NOT_CONTROLLER";

      var name = controller.prototype.name;
      if ( !name ) throw "NO_NAME";

      console.log( 'controller ' + name + ' is added' );
      this._controllers[ name ] = new controller;
    }
    catch( e ) {
      switch ( e ) {
        case 'NOT_CONTROLLER':
          console.log( file + ' is not a controller' );
          break;

        case 'NO_NAME':
          console.log( 'wrong: controller has no name in file: ' + file );
          break;

        default:
          console.log( 'Bad file is in controllers folder: ' + file );
          throw e;
          break;
      }
    }
  }
};


Router.prototype.route = function ( route_path ) {
  console.log( 'route to ' + route_path );
  var args = Array.prototype.splice.call( arguments, 1 );

  var controller_name,
      action;

  if ( route_path ) {
    if ( this._config.rules ) {
      route_path = this._config.rules[ route_path ] || route_path;
    }

    var route_rule = route_path.split('/');
    if ( !route_rule.length ) return console.log( 'Incorrect rout_path: ' + route_path );

    controller_name = route_rule[0];
    action          = route_rule[1];
  }
  else {
    controller_name = this.app.default_controller;
    action          = false;
  }

  var controller    = this._controllers[ controller_name ];
  if ( !controller ) return console.log( 'Controller or route rule "' + controller_name + '" not found' );

  controller.run_action( action, args );
};


Router.prototype.get_controller = function ( name ) {
  return this._controllers[ name ] || null;
};