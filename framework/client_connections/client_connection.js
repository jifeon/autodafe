var Component = global.autodafe.Component;
var http      = require( 'http' );

module.exports = ClientConnection.inherits( Component );

function ClientConnection( params ) {
  this._init( params );
}


ClientConnection.prototype._init = function ( params ) {
  ClientConnection.parent._init.call( this, params );

  var self = this;
  this.app.on( 'run', function() {
    self.run();
  } );
  
  this.app.on( 'close', function() {
    self.close();
  } );
};


ClientConnection.prototype.get_server = function ( port ) {
  var server = http.createServer();

  try {
    server.listen( port );
  }
  catch( e ) {
    this.log( 'Can not listen server on port %s'.format( port ), 'error' );
    return null;
  }

  return server;
};


ClientConnection.prototype.run    = function () {};
ClientConnection.prototype.close  = function () {};