var io                = require('socket.io');
var ClientConnection  = require('../client_connection');
var WebSocketsClient  = require('./web_sockets_client');

module.exports = WebSocketsServer.inherits( ClientConnection );

function WebSocketsServer( config ) {
  this._init( config );
}


WebSocketsServer.prototype.ios = {};


WebSocketsServer.prototype._init = function ( params ) {
  WebSocketsServer.parent._init.call( this, params );

  this._.io               = null;
  this._.port             = params.port            || 8080;
  this._.connection_name  = params.connection_name || this.app.name;

  var self = this;
  this.app.on( 'components_are_loaded', function(){
    if ( self.app.http ) self.app.http.set_root_folder(
      'SocketIO',
      require('path').join( autodafe.base_dir, '..', 'node_modules/socket.io/node_modules/socket.io-client/dist' ) );
  } );
};


WebSocketsServer.prototype._run = function () {
  if ( !this.ios[ this.port ] ) {
    var server  = this.get_server( this.port );
    if ( !server ) return this.log( 'WebSockets server not running at port ' + this.port, 'warning' );

    this.ios[ this.port ] = io.listen( server );
  }

  this._.io = this.ios[ this.port ];

  var self = this;
  this.io.of( '/' + this.connection_name ).on( 'connection', function( client ) {
    new WebSocketsClient({
      app        : self.app,
      ws_client  : client,
      connection : self
    });
  } );

  this.log( 'WebSockets server for `%s` started at port %s'.format( this.connection_name, this.port ), 'info' );
};