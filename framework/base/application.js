//var WebSocketServer = require('../servers/web_socket_server');
//var Server = require('server');
var http              = require('http');
var Router            = require('router');
var MysqlDBConnection = require('../db/mysql/mysql_db_connection');

var Application = module.exports = function( config ) {
  this._init( config );
}


Application.prototype._init = function ( config ) {
  this._config    = config              || {};

  this.name               = this._config.name   || 'My Autodafe application';
  this.params             = this._config.params || {};
  this.default_controller = this._config.default_controller || 'action';

  this._server    = null;
  this._router    = null;
  this._db        = null;

  this._base_dir  = this._config.base_dir;
  if ( !this._base_dir ) throw new Error( 'Parametr "base_dir" does not specified in your config file.' );
  if ( this._base_dir[ this._base_dir.length - 1 ] != '/' ) this._base_dir += '/';

  this._init_models();
  this._init_router();
  this._init_database();
};


Application.prototype._init_models = function () {
  require.paths.push( this._base_dir + 'models/' );
};


Application.prototype._init_router = function () {
  this._config.router = this._config.router || {};
  this._config.router.application = this;

  this._router = new Router( this._config.router );
};


Application.prototype._init_database = function () {
  if ( !this._config.db ) {
    console.log( 'WARNING!! Database is not conected, because where are no config for it in config file' );
    return null;
  }

  this._db = new MysqlDBConnection( this._config.db );
  return this._db;
};


Application.prototype.run = function () {
  this._create_server();
};


Application.prototype._create_server = function () {
  var server_config = this._config.server || {};

  this._server = http.createServer( function( req, res ) {} );
  this._server.listen( server_config.port || 8080 );
};


Application.prototype.get_db = function () {
  return this._db ? this._db : this._init_database();
};


Application.prototype.get_base_dir = function () {
  return this._base_dir;
};


Application.prototype.get_server = function () {
  return this._server;
};


Application.prototype.get_controller = function ( name ) {
  return this._router.get_controller( name );
};