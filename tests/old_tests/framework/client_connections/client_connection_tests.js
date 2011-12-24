exports.get_batch = function( application, assert ) {
  var Client            = require( 'autodafe/framework/client_connections/client' );
  var ClientConnection  = require( 'autodafe/framework/client_connections/client_connection' );
  var Session           = require( 'autodafe/framework/base/session' );

  var session_id = 'client_connection_test_session';
  var client     = null;

  return {
    topic : new ClientConnection({
      app   : application,
      name  : 'test_transport'
    }),
    'connect client' : function( transport ){
      client = new Client({
        transport : transport,
        app       : application
      });

      var event_client = null;

      application.router.get_controller( 'test' ).on( 'connect_client', function( client ) {
        event_client = client;
      } );

      transport.connect_client( client );

      assert.equal( event_client, client );
    },
    'receive request' : function( transport ){
      var event_data    = null;
      var event_client  = null;
      var data          = {
        param : 42
      };

      transport.on( 'receive_request', function( data, client ) {
        event_data    = data;
        event_client  = client;
      } );
      client.request = { method : 'ANY' };
      client.emit( 'request', data );

      assert.equal( event_client, client );
      assert.equal( event_data, data );
    },
    'send response' : function( transport ){
      var event_data    = null;
      var event_client  = null;
      var data          = {
        param : 42
      };

      transport.on( 'send_response', function( data, client ) {
        event_data    = data;
        event_client  = client;
      } );

      client.emit( 'send', data );

      assert.equal( event_client, client );
      assert.equal( event_data, data );
    },
    'disconnect client' : function( transport ){
      var event_client = null;

      transport.on( 'disconnect_client', function( client ) {
        event_client = client;
      } );

      client.emit( 'disconnect' );

      assert.equal( event_client, client );
    }
  }
}