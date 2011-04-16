var ProxyHandler = require('./proxy_handler');
var ModelProxyHandler = require('./model_proxy_handler');
var AppModule    = require('app_module');

module.exports = ModelsProxyHandler.inherits( ProxyHandler );

function ModelsProxyHandler( params ) {
  this._init( params );
}


ModelsProxyHandler.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params || !params.app )
    throw new Error( 'Link to application is not defined in ModelsProxyHandler.init' );

  this.app = params.app;
};


ModelsProxyHandler.prototype.get = function ( receiver, name ) {
  if ( this.target[ name ] ) return this.target[ name ];

  var model;
  try {
    model = require( name );
  }
  catch( e ) {
    throw new Error( 'Can\'t find model `%s`'.format( name ) );
  }

  var self = this;
  var create_model = function() {
    return new model({
      app : self.app
    });
  }

  var model_handler = new ModelProxyHandler({
    on_call : create_model
  });

  this.target[ name ] = model_handler.get_proxy();

  return this.target[ name ];
};