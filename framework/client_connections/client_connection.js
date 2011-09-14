var Component = require('components/component');

module.exports = ClientConnection.inherits( Component );

function ClientConnection( params ) {
  this._init( params );
}


ClientConnection.prototype._init = function ( params ) {
  this.super_._init( params );

  var self = this;
  this.app.on( 'run', function() {
    self.run();
  } );
  
  this.app.on( 'close', function() {
    self.close();
  } );
};


ClientConnection.prototype.connect_client = function ( client ) {
  var self = this;

  client.on( 'request', function( request ) {
    self._receive_request( request, client );
  } );

  client.on( 'disconnect', function() {
    self._disconnect_client( client );
  } );

  client.on( 'send', function( data ) {
    self._send_response( data, client );
  } );

  var controller = this.app.router.get_controller( this.app.default_controller );
  var emitter;
  if (
    !controller ||
    typeof controller.connect_client != 'function' ||
    !( ( emitter = controller.connect_client( client ) ) instanceof process.EventEmitter )
  )
    return client.connect();


  emitter
    .on( 'success', function() { client.connect(); } )
    .on( 'error', function( e ){
      e.number = 404;
      if ( !client.send_error( e ) ) throw e;
    } );
};


ClientConnection.prototype._receive_request = function ( data, client ) {
  this.emit( 'receive_request', data, client );

  this.log( 'Message has been received. Session id - `%s`'.format( client.session.id ) );

  try {
    this.app.router.route( data.action, data.params, client );
  }
  catch ( e ) {
    if ( !client.send_error( e ) ) throw e;
  }
};


ClientConnection.prototype._send_response = function ( data, client ) {
  this.emit( 'send_response', data, client );
};


ClientConnection.prototype._disconnect_client = function ( client ) {
  this.emit( 'disconnect_client', client );
};


ClientConnection.prototype.run    = function () {};
ClientConnection.prototype.close  = function () {};