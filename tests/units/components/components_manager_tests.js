var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

vows.describe( 'components manager' ).addBatch({

  'Components Application' : {
    topic : function(){
      var config = require('autodafe/tests/applications/components_test_app/config');
      tests_tools.get_new_app( config, {
        create_callback : this.callback
      } );
    },

    'should be created without errors' : function( err, app ){
      assert.isNull( err );
    },

    '.components' : {
      // todo: delete, it's tmp fix for vows
      topic : function( app ){
        return app;
      },

      'compare with config, value in config for component is' : {

        'object' : function( app ){
          var LogRouter = require( 'autodafe/framework/logging/log_router' );
          assert.instanceOf( app.log_router, LogRouter );
        },

        'object with params which should be sent to component' : function( app ){
          var ConsoleRoute = require( 'autodafe/framework/logging/console_log_route' );
          assert.instanceOf( app.log_router.get_route( 'console' ), ConsoleRoute );
        },

        'true' : function( app ){
          var HTTPServer = require( 'autodafe/framework/client_connections/http/http_server' );
          assert.instanceOf( app.http, HTTPServer );
        },

        'false' : function( app ){
          assert.isUndefined( app.web_sockets, 'WebSocketServer must be not included' );
        }
      },

      'load on the fly' : {

        'system component without params' : function( e, app ){
          assert.doesNotThrow( function() {
            app.components.load( 'web_sockets', true );
          })

          var WebSocketsServer = require( 'autodafe/framework/client_connections/web_sockets/web_sockets_server' );
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
          assert.instanceOf( app.user_component, autodafe.Component );
        },

        'param of user\'s component should be equal 42' : function( e, app ) {
          assert.equal( app.user_component.param, 42 );
        }
      },

      'nested user component' : {

        'should be instance of `Component`' : function( e, app ) {
          assert.instanceOf( app.nested_user_component, autodafe.Component );
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
      },

      'try load unknown component' : function( app ) {
        assert.throws( function() {
          app.components.load( 'unknown_component', true );
        } );
      },

      'outside components' : function( app ){
        assert.instanceOf( app.sample, autodafe.Component );
        assert.instanceOf( app.preload, autodafe.Component );
        assert.equal( app.sample.models_in_app, app.models );
        // preload загружается до инициализации моделей
        assert.isNull( app.preload.models_in_app );
      }
    },

    'user and system component with same name' : function(){
      throw 'no test';
    },

    'widgets tests' : function(){
      throw 'no test';
    },

    'get system component' : function(){
      throw 'no test';
    },

    'get user component' : function(){
      throw 'no test';
    }
  }
}).export( module );



