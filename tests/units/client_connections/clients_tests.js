var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var Client            = require( 'autodafe/framework/client_connections/client' );
var ClientConnection  = require( 'autodafe/framework/client_connections/client_connection' );
var Session           = require( 'autodafe/framework/base/session' );
var Request           = require( 'autodafe/framework/client_connections/request' );

vows.describe( 'client connection' ).addBatch({
  "Application" : {

    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    'ClientConnection' : {

      topic : function( app ){
        return new ClientConnection({
          app   : app,
          name  : 'test_transport'
        });
      },

      '.get_server()' : function( connection ){
        assert.instanceOf( connection.get_server( 3005 ), require('http').Server );
      },

      'on create client `connection` is required' : function( connection ){
        var app = this.context.topics[1];
        assert.throws( function() {
          new Client({
            app         : app,
            connection  : 1
          });
        } );
      },

      'connect client' : function( connection ){
        var app          = this.context.topics[1];
        var event_client = null;

        connection.on( 'connect_client', function( client ) {
          event_client = client;
        } );

        var client  = new Client({
          app         : app,
          connection  : connection
        });

        assert.equal( event_client, client );
      },

      'Client' :  {
        topic : function( connection, app ){
          return new Client({
            connection  : connection,
            app         : app
          });
        },

        '.connection should be read only and instance of `ClientConnection`' : function( client ){
          assert.isReadOnly( client, 'connection' );
          assert.instanceOf( client.connection, ClientConnection );
        },

        '.session' : function( client ){
          assert.isReadOnly( client, 'session' );
          assert.instanceOf( client.session, Session );
          assert.equal( client.session.id, client.get_session_id() );
        },

        '.connected' : function( client ){
          assert.isReadOnly( client, 'connected' );
          assert.isTrue( client.connected );
        },

        '.get_cookie should returns undefined' : function( client ){
          assert.isUndefined( client.get_cookie( 'cookie' ) );
        },

        '.create_query()' : {
          topic : function( client ){
            return client.create_request();
          },

          'should create query with `app` and `client` properties' : function( query ){
            var client = this.context.topics[1];

            assert.instanceOf( query, Request );
            assert.equal( query.app, client.app );
            assert.equal( query.client, client );
          },

          'and receive it' : function( query ){
            query.action = 'test_client_connection';
            query.params = { secret : 42 };

            var client_in_connection_receive_event  = null;
            var query_in_connection_receive_event   = null;
            var query_in_client_receive_event       = null;
            var client_in_connection_send_event     = null;
            var data_in_connection_send_event       = null;
            var data_in_client_send_event           = null;

            var client     = this.context.topics[1];
            var connection = this.context.topics[2];

            connection.once( 'receive_request', function( query, client ) {
              client_in_connection_receive_event  = client;
              query_in_connection_receive_event   = query;
            } );

            client.once( 'receive_request',     function( query ){
              query_in_client_receive_event       = query;
            } );

            connection.once( 'send_response',   function( data, client ) {
              client_in_connection_send_event     = client;
              data_in_connection_send_event       = data;
            } );

            client.once( 'send',                function( data ){
              data_in_client_send_event           = data;
            } );

            client.receive( query );

            assert.equal( client_in_connection_receive_event, client );
            assert.equal( query_in_connection_receive_event,  query  );
            assert.equal( query_in_client_receive_event,      query  );
            assert.equal( client_in_connection_send_event,    client );
            assert.equal( data_in_connection_send_event,      query.params );
            assert.equal( data_in_client_send_event,          query.params );
          }
        },

        '.disconnect()' : function( client ){
          var client_in_event        = null;
          var disconnect_emited      = false;
          var connection             = this.context.topics[1];

          connection.once( 'disconnect_client', function( client ) {
            client_in_event  = client;
          } );

          client.once( 'disconnect', function(){
            disconnect_emited = true;
          } );

          client.disconnect();

          assert.equal( client_in_event, client );
          assert.isTrue( disconnect_emited );
        },

        '.send_error()' : function( client ){
          var client_in_connection_event  = null;
          var error_in_connection_event   = false;
          var error_in_client_event       = false;

          var connection = this.context.topics[1];
          var error      = new Error('test error');

          connection.once( 'send_error', function( e, client ) {
            client_in_connection_event  = client;
            error_in_connection_event   = e;
          } );

          client.once( 'send_error', function( e){
            error_in_client_event = e;
          } );

          client.send_error( error );

          assert.equal( client_in_connection_event, client );
          assert.equal( error_in_connection_event,  error );
          assert.equal( error_in_client_event,      error );
        }
      }
    }
  }
}).export( module );