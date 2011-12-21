exports.get_batch = function( application, assert ) {
  var Autodafe          = global.autodafe;
  var LogRouter         = require( 'autodafe/framework/logging/log_router' );
  var ConsoleRoute      = require( 'autodafe/framework/logging/console_log_route' );
  var UsersManager      = require( 'autodafe/framework/users/users_manager' );
  var Component         = global.autodafe.Component;
  var WebSocketsServer  = require( 'autodafe/framework/client_connections/web_sockets/web_sockets_server' );

  return {
    topic : application.components,

    'loaded components' : {
      topic : function() {
        var config = require('autodafe/tests/test_app/config/config_with_different_components');

        var self  = this;
        var app   = Autodafe.create_application( config );
        app.run( function(){
          self.callback( null, app );
        } );
      },
      'compare with config, value in config for component is' : {
        'object' : function( e, app ){
          assert.instanceOf( app.log_router, LogRouter );
        },
        'object with params which should be sent to component' : function( e, app ){
          assert.instanceOf( app.log_router.get_route( 'console' ), ConsoleRoute );
        },
        'true' : function( e, app ){
          var Tests = require( 'autodafe/framework/tests/test_component' );
          assert.instanceOf( app.tests, Tests );
        },
        'false' : function( e, app ){
          assert.isUndefined( app.web_sockets, 'WebSocketServer must be not included' );
        }
      },

      'load on the fly' : {
        'system component without params' : function( e, app ){
          assert.doesNotThrow( function() {
            app.components.load( 'web_sockets', true );
          })

          assert.instanceOf( app.web_sockets, WebSocketsServer );
        },
        'with params' : function( e, app ){
          assert.doesNotThrow( function() {
            app.components.load( 'another_nested_component', {
              param : 5
            } );
          })

          assert.equal( app.another_nested_component.param, 5 );
        }
      },

      'user component' : {
        'should be instance of `Component`' : function( e, app ) {
          assert.instanceOf( app.user_component, Component );
        },
        'param of user\'s component should be equal 42' : function( e, app ) {
          assert.equal( app.user_component.param, 42 );
        }
      },

      'nested user component' : {
        'should be instance of `Component`' : function( e, app ) {
          assert.instanceOf( app.nested_user_component, Component );
        },
        'param of nested user\'s component should be equal 43' : function( e, app ) {
          assert.equal( app.nested_user_component.param, 43 );
        }
      },

      'hidden component in `lib` folder should not be loaded' : function( e, app ) {
        assert.throws( function() {
          app.components.load( 'hidden_component', true );
        } );
        assert.isUndefined( app.hidden_component );
      }
    },

    'try load unknown component' : function( components ) {
      assert.throws( function() {
        components.load( 'unknown_component', true );
      } );
    },

    'try to load not configured component should log a warning' : function( components ){
      var test_log_route = application.log_router.get_route('test');
      var messages       = test_log_route.grep_messages( function() {
        components.load( 'unknown_component' );
      } );

      assert.isTrue( messages.some( function( message ) { return message.level == 'warning'; } ) );
    }
  }
}



/*


,

    'warnings about trying to' : {
      topic : function() {
        var config = require('config/config_with_log_router_only');
        return Autodafe.create_application( config );
      },
      'get not configured system components' : function( app ){
        var test_log_route = app.log_router.get_route( 'test' );
        var message        = test_log_route.get_first_message( function() {
          var users_manager = app.tests;
        } );

        assert.isNotNull( message );
        assert.equal( message.level, 'warning' );
      },
      'set not configured system components' : function( app ){
        var test_log_route = app.log_router.get_route( 'test' );
        var message        = test_log_route.get_first_message( function() {
          app.tests = 'fail';
        } );

        assert.isNotNull( message );
        assert.equal( message.level, 'warning' );
      }
    }



*/
