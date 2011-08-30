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

  var app_count = 0;
  function get_new_app( app_config, options ) {
    options = options || {};

    app_config = app_config ||  {
      base_dir : config.base_dir,
      name     : 'test_application' + app_count++
    };

    var app = Autodafe.create_application( app_config );

    if ( !options.do_not_run ) app.run();

    return app;
  }

  function base_dir() {
    return config.base_dir.substring( 0, config.base_dir.indexOf('config/..') );
  }

  return {
    topic : application,
    'Application' : {

      '.instances' : function( app ){
        assert.include( Application.instances, app );
      },

      '.name' : function ( app ) {
        assert.equal( app.name, config.name );
        assert.isReadOnly( app, 'name' )
      },
      
      '.base_dir' : function ( app ) {
        assert.equal( app.base_dir, base_dir() );
        assert.isReadOnly( app, 'base_dir' )
      },

      '.is_running' : function( app ){
        assert.isReadOnly( app, 'is_running' );
      },

      '.default_controller' : function( app ){
        assert.equal( app.default_controller, config.default_controller );
        assert.equal( get_new_app().default_controller, 'action' );
      },

      '.models_folder' : function( app ){
        assert.equal( app.models_folder, base_dir() + 'models/' );
        assert.isReadOnly( app, 'models_folder' )
      },

      '.controllers_folder' : function( app ){
        assert.equal( app.controllers_folder, base_dir() + 'controllers/' );
        assert.isReadOnly( app, 'controllers_folder' )
      },

      '.components_folder' : function( app ){
        assert.equal( app.components_folder, base_dir() + 'components/' );
        assert.isReadOnly( app, 'components_folder' )
      },

      '.logger' : function( app ) {
        assert.instanceOf( app.logger, Logger );
      },

      '.router' : function( app ) {
        assert.instanceOf( app.router, Router );
      },

      '.components' : function( app ) {
        assert.instanceOf( app.components, ComponentsManager );
      },

      '.models' : {
        '.test_model' : {
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
        'new test_model' : {
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
        'new test_model( params )' : {
          topic : function( app ){
            return new app.models.test_model({
              param : 54
            });
          },
          'should pass params' : function( test_model ){
            assert.equal( test_model.test(), 54 );
          }
        },
        '.get_model()' : {
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
      
      '.construct()' : function(){
        // without name
        assert.throws( function() {
          new Application({
            base_dir : '.'
          });
        } );

        // without base_dir
        assert.throws( function() {
          new Application({
            name : 'app_name'
          });
        } );
      },

      '.get_param()' : function( app ) {
        assert.equal( app.get_param( 'param1' ), 'some param' );
        assert.isZero( app.get_param( 'param2' ) );
        assert.isFalse( app.get_param( 'param3' ) );
        assert.isNull( app.get_param( 'param4' ) );
        assert.isNull( app.get_param( 'param5' ) );
      },

      '.run()' : function( app ) {
        var run_count = 0;

        var new_app = get_new_app( null, {
          do_not_run : true
        } );
        assert.isFalse( new_app.is_running );

        new_app.on( 'run', function() {
          run_count++;
        } );

        assert.isTrue( new_app.run() );
        assert.isTrue( new_app.is_running );
        assert.isFalse( new_app.run() );
        assert.equal( run_count, 1 );
      },

      '.log()' : function( app ){
        var test_log_route = app.log_router.get_route( 'test' );
        var message        = test_log_route.get_first_message( function() {
          app.log( 'text', 'info', 'module' );
        } );

        assert.isNotNull( message );
        assert.equal( message.text,   'text' );
        assert.equal( message.level,  'info' );
        assert.equal( message.module, 'module' );
      },

      '.register_component()' : {
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
        },
        'registration by string' : function( app ){
          assert.isUndefined( app.my_component ); // before registration it's just undefined

          app.register_component( 'my_component' );
          assert.throws( function(){
            app.my_component;                     // after registration it throw an error about not connected component
          } );

          assert.doesNotThrow( function(){
            app.register_component(               // but we still register component with this name
              new Component({
                name  : 'my_component',
                app   : app
              })
            );

            app.my_component;
          } );
        }
      },

      '.get_session()' : {
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
    }
  }
}