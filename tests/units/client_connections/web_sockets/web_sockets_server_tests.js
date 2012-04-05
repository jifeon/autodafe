var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var SocketIOClient   = require('socket.io-client');
var WebSocketsServer = require('autodafe/framework/client_connections/web_sockets/web_sockets_server');
var WebSocketsClient = require('autodafe/framework/client_connections/web_sockets/web_sockets_client');

vows.describe( 'web sockets server' ).addBatch({
  'In normal application' : {
    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    'WebSocketsServer' : {
      topic : function( app ){
        return app.web_sockets;
      },

      'should be instance of WebSocketsServer' : function( ws_server ){
        assert.instanceOf( ws_server, WebSocketsServer );
      },

      'should be run on 8080 port' : function( ws_server ){
        assert.equal( ws_server.port, 8080 );
      },

      'should create WebSocketsClient' : {
        topic : function( ws_server, app ){
          var self = this;

          ws_server.on( 'connect_client', function( client ){
            self.callback( null, client );
          } );

          var socket = SocketIOClient.connect( 'http://localhost:' + ws_server.port + '/' + app.name );

          socket.on('error', function( e ) {
            self.callback( e );
          });
        },
        'on connect' : function( e, client ){
          assert.isNull( e );
          assert.instanceOf( client, WebSocketsClient );
        }
      }
    }
  }
}).export( module );