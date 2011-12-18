var Component = global.autodafe.Component;

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


ClientConnection.prototype.run    = function () {};
ClientConnection.prototype.close  = function () {};