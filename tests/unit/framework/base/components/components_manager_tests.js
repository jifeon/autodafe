exports.get_batch = function( application, assert ) {
  var Autodafe        = require('autodafe');
  var LogRouter       = require( 'logging/log_router' );
  var ConsoleRoute    = require( 'logging/console_log_route' );
  var UsersManager    = require( 'users/users_manager' );
  var Component       = require( 'components/component' );

  return {
    topic : application.components,

    'loaded components' : {
      topic : function() {
        var config = require('config/config_with_different_components');

        return Autodafe.create_application( config );
      },
      'compare with config, value in config for component is' : {
        'object' : function( app ){
          assert.instanceOf( app.log_router, LogRouter );
        },
        'object with params which should be sent to component' : function( app ){
          assert.instanceOf( app.log_router.get_route( 'console' ), ConsoleRoute );
        },
        'true' : function( app ){
          assert.instanceOf( app.user, UsersManager );
        },
        'false' : function( app ){
          assert.isUndefined( app.web_sockets, 'WebSocketServer must be not included' );
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
        assert.isUndefined( app.hidden_component );
      }
    },

    'try load unknown component' : function( components ) {
      assert.throws( function() {
        components.load( 'unknown_component' );
      } );
    }
  }
}