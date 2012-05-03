module.exports = Response.inherits( autodafe.AppModule );

function Response( params ) {
  this._init( params );
}


Response.prototype._init = function( params ) {
  Response.parent._init.call( this, params );

  if ( !autodafe.Controller.is_instantiate( params.controller ) )
    throw new Error( '`controller` should be instance of Controller in Response._init' );
  this.controller = params.controller;

  this.view       = params.view;
  this.params     = params.params;
  this.text       = null;
};


Response.prototype.to = function( client ){
  var params = Object.merge( this.params, this.controller.global_view_params( this, client ) );

  var self = this;
  this.controller.render( this.view, params, function( e, data ){
    if ( e ) return self.emit( 'error', e );

    self.text = data;
    self.emit( 'data', self.text );

    client.send( self.text );
  } );

  return this;
};