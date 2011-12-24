exports.get_batch = function( application, assert ) {
  var Session           = require( 'autodafe/framework/base/session' );
  var Client            = require( 'autodafe/framework/client_connections/client' );
  var ClientConnection  = require( 'autodafe/framework/client_connections/client_connection' );

  var sid    = Math.random();
  var client = new Client({
    app       : application,
    connection : new ClientConnection({
      app   : application,
      name  : 'test_connection'
    })
  });

  var client2 = new Client({
    app       : application,
    connection : new ClientConnection({
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
            app     : app
          });
        } );
      }
    },
    'normal work -' : {
      topic : new Session({
        app     : application,
        id      : sid
      }),
      'properties `id`, `clients` and `is_active` should be read only' : function( session ){
        assert.isReadOnly( session, 'id' );
        assert.isReadOnly( session, 'clients' );
        assert.isReadOnly( session, 'is_active' );
      },
      '`id` should be equal 1' : function( session ){
        assert.equal( session.id, sid );
      },
      '`clients` should be an empty Array' : function( session ){
        assert.isArray( session.clients );
        assert.isEmpty( session.clients );
      },
      '`is_active` should be true' : function( session ){
        assert.isTrue( session.is_active );
      },
      'add client' : function( session ){
        assert.isTrue( session.add_client( client ) );
        assert.length( session.clients, 1 );
        assert.isTrue( session.add_client( client2 ) );
        assert.length( session.clients, 2 );

        assert.throws( function() {
          session.add_client( {} )
        } );

        var add_result;
        var test_log_route = application.log_router.get_route( 'test' );
        var message        = test_log_route.get_first_message( function() {
          add_result = session.add_client( client );
        } );

        assert.isFalse( add_result );
        assert.isNotNull( message );
        assert.equal( message.level, 'warning' );

        client2.disconnect();
        assert.length( session.clients, 1 );

        assert.doesNotThrow( function() {
          session.remove_client( 5 );
        } );

        session.remove_client( client );
        assert.isEmpty( session.clients );
        assert.isFalse( session.is_active );
      },
      'close session' : function(){
        var session = new Session({
          app     : application,
          id      : Math.random()
        });

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