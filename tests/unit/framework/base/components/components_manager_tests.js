exports.get_batch = function( application, assert ) {
  var Autodafe          = require( 'autodafe' );
  var LogRouter         = require( 'logging/log_router' );
  var ConsoleRoute      = require( 'logging/console_log_route' );
  var UsersManager      = require( 'users/users_manager' );
  var Component         = require( 'components/component' );
  var WebSocketsServer  = require( 'client_connections/web_sockets/web_sockets_server' );

  return {
    topic : application.components,

    'loaded components' : {
      topic : function() {
        var config = require('config/config_with_different_components');

        var app = Autodafe.create_application( config );
        app.run();
        return app;
      },
      'compare with config, value in config for component is' : {
        'object' : function( app ){
          assert.instanceOf( app.log_router, LogRouter );
        },
        'object with params which should be sent to component' : function( app ){
          assert.instanceOf( app.log_router.get_route( 'console' ), ConsoleRoute );
        },
        'true' : function( app ){
          assert.instanceOf( app.users, UsersManager );
        },
        'false' : function( app ){
          assert.isUndefined( app.web_sockets, 'WebSocketServer must be not included' );
        }
      },

      'load on the fly' : {
        'system component without params' : function( app ){
          assert.doesNotThrow( function() {
            app.components.load_component( 'web_sockets', true );
          })

          assert.instanceOf( app.web_sockets, WebSocketsServer );
        },
        'with params' : function( app ){
          assert.doesNotThrow( function() {
            app.components.load_component( 'another_nested_component', {
              param : 5
            } );
          })

          assert.equal( app.another_nested_component.param, 5 );
        }
      },

      'user component' : {
        'should be instance of `Component`' : function( app ) {
          assert.instanceOf( app.user_component, Component );
        },
        'param of user\'s component should be equal 42' : function( app ) {
          assert.equal( app.user_component.param, 42 );
        }
      },

      'nested user component' : {
        'should be instance of `Component`' : function( app ) {
          assert.instanceOf( app.nested_user_component, Component );
        },
        'param of nested user\'s component should be equal 43' : function( app ) {
          assert.equal( app.nested_user_component.param, 43 );
        }
      },

      'hidden component in `lib` folder should not be loaded' : function( app ) {
        assert.throws( function() {
          app.components.load_component( 'hidden_component', true );
        } );
        assert.isUndefined( app.hidden_component );
      }
    },

    'try load unknown component' : function( components ) {
      assert.throws( function() {
        components.load_component( 'unknown_component', true );
      } );
    },

    'try to load not configured component should log a warning' : function( components ){
      var test_log_route = application.log_router.get_route('test');
      var messages       = test_log_route.grep_messages( function() {
        components.load_component( 'unknown_component' );
      } );

      assert.isTrue( messages.some( function( message ) { return message.level == 'warning'; } ) );
    }
  }
}