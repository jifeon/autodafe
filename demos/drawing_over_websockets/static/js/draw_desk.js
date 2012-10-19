function DrawDesk ( params ) {
  this.init( params );
}


DrawDesk.prototype.init = function ( params ) {
  this.socket   = params.socket;
  this.canvas   = params.canvas;
  this.ctx      = this.canvas.getContext( '2d' );
  this.position = {
    x : this.canvas.offsetLeft,
    y : this.canvas.offsetTop
  }

  this.point  = null;

  this.add_handlers();
};


DrawDesk.prototype.add_handlers = function () {
  var self = this;

  var mousemove = function( e ) {
    self.mousemove( e );
  }

  this.canvas.onmousedown = function( e ) {
    self.canvas.onmousemove = mousemove;
    self.point = {
      x : e.clientX - self.position.x,
      y : e.clientY - self.position.y
    };
  };

  document.body.onmouseup = function() {
    self.canvas.onmousemove = null;
  };

  this.socket.on( 'line', function( params ){
    self.line( params );
  } );
};


DrawDesk.prototype.mousemove = function ( e ) {
  var old_point = this.point;

  this.point = {
    x : e.clientX - this.position.x,
    y : e.clientY - this.position.y
  };

  var params = {
    p1 : old_point,
    p2 : this.point
  }

  this.line( params );
  this.socket.emit( 'message', {
    action : 'line',
    params : params
  } );
};


DrawDesk.prototype.line = function ( params ) {
  this.ctx.beginPath();
  this.ctx.moveTo( params.p1.x, params.p1.y );
  this.ctx.lineTo( params.p2.x, params.p2.y );
  this.ctx.stroke();
};
