var io = require('socket.io');

module.exports = WebSocketsServer.inherits( global.autodafe.cc.ClientConnection );

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
    this.ios[ this.port ].set('log level', 2);
  }

  this._.io = this.ios[ this.port ];

  var self = this;
  this.io.of( '/' + this.connection_name ).on( 'connection', this.create_client.bind( this ) );

  this.log( 'WebSockets server for `%s` started at port %s'.format( this.connection_name, this.port ), 'info' );
};


/**
 * Создает WebSockets клиента
 *
 * @param io_client
 * @returns {WebSocketsClient}
 */
WebSocketsServer.prototype.create_client = function( io_client ){
  return new global.autodafe.cc.ws.Client({
    app        : this.app,
    ws_client  : io_client,
    connection : this
  });
}


WebSocketsServer.prototype.close = function(){
  this.io.server.close();
  this.log( 'WebSockets server for `%s` started at port %s has stoped'.format( this.connection_name, this.port ), 'info' );
}