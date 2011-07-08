exports.get_batch = function( application, assert ) {
  var Router            = require( 'router' );
  var Logger            = require( 'logging/logger' );
  var ComponentsManager = require( 'components/components_manager' );
  var Component         = require( 'components/component' );
  var Autodafe          = global.autodafe;
  var Application       = require( 'application' );
  var LogRouter         = require( 'logging/log_router' );
  var TestComponent     = require( 'tests/test_component' );
  var TestModel         = require( 'models/test_model' );
  var Client            = require( 'client_connections/client' );
  var Session           = require( 'session' );
  var ClientConnection  = require( 'client_connections/client_connection' );


  var path              = require( 'path' );
  var config            = require( 'config/main' );

  var test_vars         = {
    client : new Client({
      app       : application,
      transport : new ClientConnection({
        app   : application,
        name  : 'test_cc'
      })
    }),
    client2 : new Client({
      app       : application,
      transport : new ClientConnection({
        app   : application,
        name  : 'test_cc'
      })
    })
  };

  return {
    topic : application,
    'public properties' : {
      'Application.instances' : function( app ){
        assert.equal( Application.instances[0], app );
      },
      'property `name` should be' : {
        'equal with `name` in config file' : function ( app ) {
          assert.equal( app.name, config.name );
        },
        'read only' : function( app ){
          assert.isReadOnly( app, 'name' )
        },
        'required' : function(){
          assert.throws( function() {
            new Application({
              base_dir : '.'
            });
          } );
        }
      },
      'property `base_dir` should be' : {
        'normalized `base_dir` path from config file' : function ( app ) {
          assert.equal( app.base_dir, config.base_dir.substring( 0, config.base_dir.indexOf('config/..') ) );
        },
        'read only' : function( app ){
          assert.isReadOnly( app, 'base_dir' )
        },
        'required' : function(){
          assert.throws( function() {
            new Application({
              name : 'app_name'
            });
          } );
        }
      },
      '`logger` should be instance of Logger' : function( app ) {
        assert.instanceOf( app.logger, Logger );
      },
      '`router` should be instance of Router' : function( app ) {
        assert.instanceOf( app.router, Router );
      },
      '`components` should be instance of ComponentsManager' : function( app ) {
        assert.instanceOf( app.components, ComponentsManager );
      },
      'default controller should be read from config' : function( app ){
        assert.equal( app.default_controller, config.default_controller );
      },
      'models folder should be set to "models" by default' : function( app ){
        assert.equal( app.models_folder, 'models' );
      },
      
      'application with minimalistic configurations' : {
        topic : function() {
          var min_config  = require('config/min_config');
          var min_app     = Autodafe.create_application( min_config );
          min_app.run();
          return min_app;
        },
        '`default_controller` should be action by default' : function( app ){
          assert.equal( app.default_controller, 'action' );
        }
      }
    },

    '`models` proxy property - ' : {
      'static model' : {
        topic : function( app ) {
          return app.models.test_model;
        },
        'should be instance of function' : function( test_model ){
          assert.instanceOf( test_model, Function );
        },
        'should create instance of model' : function( test_model ){
          assert.instanceOf( test_model.me(), TestModel );
        },
        'should invoke methods' : function( test_model ){
          assert.equal( test_model.test(), 42 );
        },
        'should be cached' : function( test_model ){
          assert.equal( test_model.me(), test_model.app.models.test_model.me() );
        }
      },
      'model created using `new` operator' : {
        topic : function( app ){
          return new app.models.test_model;
        },
        'should be instance of model\'s class' : function( test_model ){
          assert.instanceOf( test_model, TestModel );
        },
        'should invoke methods' : function( test_model ){
          assert.equal( test_model.test(), 42 );
        },
        'should not be cached' : function( test_model ){
          var new_model = new test_model.app.models.test_model;

          assert.notEqual( new_model,       test_model );
          assert.notEqual( new_model.me(),  test_model.me() );
        }
      },
      'model created using `new` operator with params' : {
        topic : function( app ){
          return new app.models.test_model({
            param : 54
          });
        },
        'should pass params' : function( test_model ){
          assert.equal( test_model.test(), 54 );
        }
      },
      'model created using `get_model` method' : {
        topic : function( app ){
          return app.models.get_model( TestModel, {
            param : 48
          } );
        },
        'should be instance of model\'s class' : function( test_model ){
          assert.instanceOf( test_model, TestModel );
        },
        'should invoke methods' : function( test_model ){
          assert.equal( test_model.test(), 48 );
        },
        'should not be cached' : function( test_model ){
          var new_model = test_model.app.models.get_model( TestModel );

          assert.notEqual( new_model,       test_model );
          assert.notEqual( new_model.me(),  test_model.me() );
        }
      }
    },

    'preload components' : function() {
      var preloaded_logger_config   = require( 'config/preloaded_logger_config' );

      var application_created       = false;
      var log_router_in_controller  = null;
      var tests_in_controller       = null;

      // bellow events are emitted from test controller
      process.once( 'Preloaded logger component', function( log_router ) {
        log_router_in_controller = log_router;
        application_created = true;
      } );

      // tests must be not loaded yet
      process.once( 'Not preloaded tests component', function( tests ) {
        tests_in_controller = tests;
      } );

      var app = Autodafe.create_application( preloaded_logger_config );
      assert.isTrue( application_created, 'Application with preloaded logger is not created' );

      assert.instanceOf( log_router_in_controller, LogRouter, 'log router must be preloaded' );
      assert.isUndefined( tests_in_controller, 'tests component must not be preloaded' );

      assert.instanceOf( app.tests, TestComponent, 'Test component must be available after loading' );
    },

    'tests params' : {
      'param is string' : function( app ) {
        assert.equal( app.get_param( 'param1' ), 'some param' );
      },
      'param is zero' : function( app ){
        assert.isZero( app.get_param( 'param2' ) );
      },
      'param is false' : function( app ){
        assert.isFalse( app.get_param( 'param3' ) );
      },
      'param is null' : function( app ){
        assert.isNull( app.get_param( 'param4' ) );
      },
      'not existed param' : function( app ){
        assert.isNull( app.get_param( 'param5' ) );
      }
    },

    'application should not be run twice' : function( app ) {
      var double_run = false;

      app.once( 'run', function() {
        double_run = true;
      } );

      assert.isFalse( app.run() );
      assert.isFalse( double_run );
    },

    '`register_component` method' : {
      'simple registering' : function( app ){
        var component = new Component({
          name : 'test',
          app  : app
        });

        app.register_component( component );

        assert.equal( app.test, component );
      },
      'try to register not a component should throw an error' : function( app ){
        assert.throws( function() {
          app.register_component( { name : 'name' } );
        } );
      },
      'try to register a component with same name should throw an error' : function( app ){
        assert.throws( function() {
          app.register_component(
            new Component({
              name : 'test',
              app  : app
            })
          );
        } );
      },
      'component with conflict name which is application property or method name' : function( app ){
        assert.throws( function() {
          app.register_component(
            new Component({
              name  : 'default_controller',
              app   : app
            })
          );
        } );
      }
    },

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
    },

    'log function' : function( app ){
      var test_log_route = app.log_router.get_route( 'test' );
      var message        = test_log_route.get_first_message( function() {
        app.log( 'text', 'info', 'module' );
      } );

      assert.isNotNull( message );
      assert.equal( message.text,   'text' );
      assert.equal( message.level,  'info' );
      assert.equal( message.module, 'module' );
    },

    '`get_session` method' : {
      '`new_session` event' : function( app ) {
        var new_session_emitted = false;

        app.once( 'new_session', function() {
          new_session_emitted = true;
        } );

        test_vars.session = app.get_session( 1, test_vars.client );

        assert.isTrue( new_session_emitted );
        assert.instanceOf( test_vars.session, Session );
        assert.equal( test_vars.session.id, 1 );
        assert.length( test_vars.session.clients, 1 );

      },
      'get session with same id' : function( app ) {
        var new_session_emitted = false;

        app.once( 'new_session', function() {
          new_session_emitted = true;
        } );

        test_vars.session2 = app.get_session( 1, test_vars.client2 );

        assert.isFalse( new_session_emitted );
        assert.equal( test_vars.session, test_vars.session2 );
        assert.equal( test_vars.session.id, 1 );
        assert.length( test_vars.session.clients, 2 );
      },
      'close session' : function( app ){
        test_vars.session.close();
        var session
        assert.notEqual( test_vars.session, session = app.get_session( 1, test_vars.client ) );

        assert.length( session.clients, 1 );
      }
    }
  }
}