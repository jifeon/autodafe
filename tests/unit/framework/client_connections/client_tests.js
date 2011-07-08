exports.get_batch = function( application, assert ) {
  var Client            = require('client_connections/client');
  var ClientConnection  = require('client_connections/client_connection');

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
        return new Client({
          app       : app,
          transport : new ClientConnection({
            app   : application,
            name  : 'test_transport'
          })
        });
      },
      'be instance of `Client`' : function( client ){
        assert.instanceOf( client, Client );
      },
      'has `transport` which is read only and instance of `ClientConnection`' : function( client ){
        assert.isReadOnly( client, 'transport' );
        assert.instanceOf( client.transport, ClientConnection );
      },
      'return cookie as null' : function( client ){
        assert.isNull( client.get_cookie( 'cookie' ) );
      },
      'send response by transport' : function( client ){
        var event_client  = null;
        var event_data    = null;

        client.transport.on( 'send_response', function( cl, data ) {
          event_client  = cl;
          event_data    = data;
        } );

        var obj = {
          param1 : 42,
          param2 : null
        }

        client.send( obj );

        assert.equal( event_data, obj );
        assert.equal( event_client, client );
      }
    }
  }
}