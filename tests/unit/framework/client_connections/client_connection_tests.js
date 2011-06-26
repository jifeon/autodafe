exports.get_batch = function( application, assert ) {
  var Client            = require( 'client_connections/client' );
  var ClientConnection  = require( 'client_connections/client_connection' );
  var Session           = require( 'session' );

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

      var event_session = null;

      application.router.get_controller( 'test' ).on( 'connect_client', function( client ) {
        event_session = session;
      } );

      transport.connect_client( client );

      assert.instanceOf( event_session, Session );
      assert.equal( event_session.id, session_id );
      assert.isTrue( event_session.is_active );
    },
    'receive request' : function( transport ){
      var event_data    = null;
      var event_session = null;
      var data          = {
        param : 42
      };

      transport.on( 'receive_request', function( data, session ) {
        event_data    = data;
        event_session = session;
      } );

      client.emit( 'request', data );

      assert.equal( event_session.id, session_id );
      assert.isTrue( event_session.is_active );
      assert.equal( event_data, data );
    },
    'disconnect client' : function( transport ){
      var event_session = null;

      transport.on( 'disconnect_client', function( client, session ) {
        event_session = session;
      } );

      client.emit( 'disconnect' );

      assert.equal( event_session.id, session_id );
      assert.isFalse( event_session.is_active );
    }
  }
}