//var WebSocketServer = require('../servers/web_socket_server');
//var Server = require('server');
var Router            = require('router');
var ComponentsList    = require('components/components_list');

var Application = module.exports = function( config ) {
  if ( Application.instance ) return Application.instance;
  Application.instance = this;
  
  this._init( config );
}


Application.instance = null;


require( 'sys' ).inherits( Application, process.EventEmitter );


Application.prototype._init = function ( config ) {
  this._config    = config              || {};

  if ( !this._config.base_dir ) {
    console.log( 'Error: you must set base_dir in config file!' );
    return;
  }

  this.router     = null;
  this.components = null;

  this.name               = this._config.name               || 'My Autodafe application';
  this.default_controller = this._config.default_controller || 'action';

  this.__defineGetter__( 'base_dir', function () {
    return this._config.base_dir;
  });


  this._init_core();
  this._init_components();
};


Application.prototype._init_core = function () {
  require.paths.unshift( this.base_dir + 'models/' );

  this.router = new Router( this._config.router );
};


Application.prototype._init_components = function () {
  this.components = new ComponentsList( this._config.components );
};


Application.prototype.get_param = function ( name ) {
  return this._config.params[ name ] || null;
};



Application.prototype.run = function () {
  this.emit( 'run' );
};