var AppModule = global.autodafe.AppModule;
var WebSocket = require('websocket-client').WebSocket;


module.exports = SocketIOClient.inherits( AppModule );

function SocketIOClient( params ) {
  this._init( params );
}


SocketIOClient.prototype._init = function( params ) {
  SocketIOClient.parent._init.call( this, params );

  this._.is_connected = false;
  this._.connection   = new WebSocket(
    'ws://localhost:' + this.app.web_sockets.port + '/socket.io/websocket'
  );

  var self = this;
  this.connection.on( 'open', function() {
    self._after_open();
  } );

  this._stack       = [];
  this._frame       = '~m~';
  this._json_frame  = '~j~';
};


SocketIOClient.prototype._after_open = function () {
  var self = this;
  this.connection.on( 'message', function( messages ) {
    self.decode( messages ).forEach( function( message ) {
      self.emit( 'message', message );
    } );
  } );

  this.connection.on( 'close', function() {
    self.emit('disconnect');
  } );

  this._.is_connected = true;
  this.emit( 'connect' );
  this.send( this._stack );
};


SocketIOClient.prototype.disconnect = function () {
  this.connection.close();
};


SocketIOClient.prototype.send = function ( messages ) {
  messages = Array.isArray( messages ) ? messages : [ messages ];

  if ( !this.is_connected ) return Array.prototype.push.apply( this._stack, messages );

  messages = this.encode( messages );
  this.connection.send( messages );
};


SocketIOClient.prototype.encode = function( messages ){
  var result = '';

  messages.forEach( function( message ) {
    message = Object.isObject( message )
      ? JSON.stringify( message )
      : message;

    result += this._frame + message.length + this._frame + message;
  }, this );

  return result;
};


SocketIOClient.prototype.decode = function( data ){
  var messages = [], number, n;
  do {
    if ( data.substr(0, 3) !== this._frame ) return messages;
    data = data.substr(3);
    number = '', n = '';
    for (var i = 0, l = data.length; i < l; i++){
      n = Number(data.substr(i, 1));
      if (data.substr(i, 1) == n){
        number += n;
      }
      else {
        data = data.substr( number.length + this._frame.length );
        number = Number(number);
        break;
      }
    }

    var message = data.substr( 0, number ); // here

    if ( message.substr(0, 3) == this._json_frame ) try {
      message = JSON.parse( message.substr( 3 ) );
    }
    catch (e){}

    messages.push( message );
    data = data.substr( number );
  } while( data !== '' );

  return messages;
};