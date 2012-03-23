var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var WebSocketsServer = require('autodafe/framework/client_connections/web_sockets/web_sockets_server');
var SocketIOClient   = require('socket.io-client');

var ws_client,
    session;
var test_controller = application.router.get_controller( 'test' );
var params          = {
  param1 : 42,
  param2 : false
};



vows.describe( 'web sockets client' ).addBatch({
  'Application' : {
    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    'connect to server' : {
      topic : function() {
        var emitter = new process.EventEmitter;

        test_controller.on( 'connect_client', function() {
          emitter.emit('success', true);
        } );

        ws_client = SocketIOClient.connect( 'localhost:' + application.web_sockets.port );

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
        assert.deepEqual( args[0], params );
      },
      'send message to client' : {
        topic : function( args, ws ) {
          session = args[2];
          var emitter = new process.EventEmitter;

          ws_client.on( 'message', function( message ) {
            emitter.emit( 'success', message );
          } );

          ws._send_response( session.client, params );

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
}).export( module );