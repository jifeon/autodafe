exports.get_batch = function( application, assert ) {
  var Session           = require( 'session' );
  var Client            = require( 'client_connections/client' );
  var ClientConnection  = require( 'client_connections/client_connection' );

  var client = new Client({
    app       : application,
    transport : new ClientConnection({
      app   : application,
      name  : 'test_connection'
    })
  });

  return {
    'wrong creation -' : {
      topic : application,
      'property `id` should be required' : function( app ){
        assert.throws( function() {
          new Session({
            app     : app,
            client  : client
          });
        } );
      },
      'property `client` should be required' : function( app ){
        assert.throws( function() {
          new Session({
            app     : app,
            id      : 2
          });
        } );
      }
    },
    'normal work -' : {
      topic : new Session({
        app     : application,
        client  : client,
        id      : 1
      }),
      'properties `id`, `client` and `is_active` should be read only' : function( session ){
        assert.isReadOnly( session, 'id' );
        assert.isReadOnly( session, 'client' );
        assert.isReadOnly( session, 'is_active' );
      },
      '`id` should be equal 1' : function( session ){
        assert.equal( session.id, 1 );
      },
      '`client` should be instance of Client' : function( session ){
        assert.instanceOf( session.client, Client );
      },
      '`is_active` should be true' : function( session ){
        assert.isTrue( session.is_active );
      },
      'close session' : function( session ){
        var close_action_emitted = false;

        session.on( 'close', function() {
          close_action_emitted = true;
        } );

        session.close();

        assert.isFalse( session.is_active );
        assert.isTrue( close_action_emitted );
      }
    }
  }
}