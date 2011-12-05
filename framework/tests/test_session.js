var Session = require('../base/session');
var Client  = require('../client_connections/client');

module.exports = TestSession.inherits( Session );

function TestSession( params ) {
  this._init( params );
}


TestSession.prototype._init = function( params ) {
  var Application = require('../base/application');
  if ( !Object.isObject( params ) || !Application.is_instantiate( params.app ) )
    throw new Error( '`app` should be instance of Application in `TestSession.init`' );

  params.id = 'test session';

  params.client = new Client({
    app       : params.app,
    transport : params.app.test_transport
  });

  this.super_._init( params );
};