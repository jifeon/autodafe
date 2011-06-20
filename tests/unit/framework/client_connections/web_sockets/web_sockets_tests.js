exports.get_batch = function( application, assert ) {
  var WebSocketsServer = require('client_connections/web_sockets/web_sockets_server');
  var SocketIOClient   = require('lib/socket.io_client');

  var ws_client,
      session;
  var test_controller = application.router.get_controller( 'test' );
  var params          = {
    param1 : 42,
    param2 : false
  };

  return {
    topic : application.web_sockets,
    '`web_sockets` component should be instance of WebSocketsServer' : function( ws ){
      assert.instanceOf( ws, WebSocketsServer );
    },
    'connect to server' : {
      topic : function() {
        var emitter = new process.EventEmitter;

        test_controller.on( 'connect_client', function() {
          emitter.emit('success', true);
        } );

        ws_client = new SocketIOClient({
          app : application
        });

        return emitter;
      },
      'success' : function( err, res ) {
        assert.isNull( err );
        assert.isTrue( res );
      }
    },
    'send message to server' : {
      topic : function( ws ){
        var emitter = new process.EventEmitter;

        test_controller.on( 'ws_test', function( args ) {
          emitter.emit('success', args );
        } );

        ws_client.send({
          action : "test.ws_test",
          params : params
        });

        return emitter;
      },
      'success' : function( err, args ){
        assert.isNull( err );
        assert.deepEqual( args[1], params );
      },
      'send message to client' : {
        topic : function( args, ws ) {
          session = args[0];
          var emitter = new process.EventEmitter;

          ws_client.on( 'message', function( message ) {
            emitter.emit( 'success', message );
          } );

          ws.send_response( session.client, params );

          return emitter;
        },
        'success' : function( err, message ){
          assert.isNull( err );
          assert.deepEqual( message, params );
        },
        'close connection' : {
          topic : function( message, args ) {
            var emitter = new process.EventEmitter;

            session.on( 'close', function() {
              emitter.emit( 'success', true );
            } );

            ws_client.disconnect();

            return emitter;
          },
          'success' : function( err, res ) {
            assert.isNull( err );
            assert.isTrue( res );
          }
        }
      }//,
//      'get cookie' : function(){
//        assert.equal( session.client.get_cookie( 'vig' ), 'vogs' );
//      }
    }
  }
}