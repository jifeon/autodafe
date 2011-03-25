exports.get_batch = function( application, assert ) {
  var Autodafe        = require('autodafe');
  var LogRouter       = require( 'logging/log_router' );
  var ConsoleRoute    = require( 'logging/console_route' );
  var UserIdentities  = require( 'users/users_identities' );

  return {
    topic : application.components,

    'link to application' : {
      'refer to right application' : function( components ){
        assert.equal( components.app, application );
      },
      'is read only' : function( components ) {
        assert.throws( function(){
          components.app = {};
        }, TypeError );
      }
    },

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
          assert.instanceOf( app.user, UserIdentities );
        },
        'false' : function( app ){
          assert.isUndefined( app.web_sockets_server, 'WebSocketServer must be not included' );
        }
      }
    },

    'try load unknwn component' : function( components ) {
      assert.throws( function() {
        components.load( 'unknown_component' );
      } );
    }
  }
}