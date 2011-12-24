exports.get_batch = function( application, assert ) {
  var Session           = require('autodafe/framework/base/session');
  var Client            = require('autodafe/framework/client_connections/client');
  var ClientConnection  = require('autodafe/framework/client_connections/client_connection');

  return {
    topic : application,
    '`transport` is required' : function( app ){
      assert.throws( function() {
        new Client({
          app       : app,
          transport : 1
        });
      } );
    },
    'simple client should' : {
      topic : function( app ) {
        var transport = new ClientConnection({
          app   : application,
          name  : 'test_transport'
        });

        var client = new Client({
          app       : app,
          transport : transport
        });

        transport.connect_client( client );

        return client;
      },
      'be instance of `Client`' : function( client ){
        assert.instanceOf( client, Client );
      },
      'have `transport` which is read only and instance of `ClientConnection`' : function( client ){
        assert.isReadOnly( client, 'transport' );
        assert.instanceOf( client.transport, ClientConnection );
      },
      'have `session`' : function( client ){
        assert.isReadOnly( client, 'session' );
        assert.instanceOf( client.session, Session );
        assert.equal( client.session.id, client.get_session_id() );
      },
      'return cookie as null' : function( client ){
        assert.isNull( client.get_cookie( 'cookie' ) );
      },
      'send response by transport' : function( client ){
        var event_client        = null;
        var event_data          = null;

        client.transport.once( 'send_response', function( data, client ) {
          event_client  = client;
          event_data    = data;
        } );

        var obj = {
          param1 : 42,
          param2 : null
        }

        client.send( obj );

        assert.equal( event_data, obj );
        assert.equal( event_client, client );
      },
      'disconnect' : function( client ){
        var event_client        = null;

        client.transport.once( 'disconnect_client', function( client ) {
          event_client  = client;
        } );

        client.disconnect();

        assert.equal( event_client, client );
      }
    }
  }
}