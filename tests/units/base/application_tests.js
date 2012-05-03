var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var path        = require( 'path' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );


var Autodafe          = require( 'autodafe' );
var Application       = require( 'autodafe/framework/base/application' );
var Router            = require( 'autodafe/framework/base/routing/router' );
var Logger            = require( 'autodafe/framework/logging/logger' );
var ComponentsManager = require( 'autodafe/framework/components/components_manager' );
var TestModel         = require( 'autodafe/tests/applications/normal_app/models/test_model.js' );
var Client            = require( 'autodafe/framework/client_connections/client' );
var Session           = require( 'autodafe/framework/base/session' );
var ClientConnection  = require( 'autodafe/framework/client_connections/client_connection' );


var config    = tests_tools.normal_config;

function get_client( app ){
  return new Client({
    app       : app,
    connection : new ClientConnection({
      app   : app,
      name  : 'test_cc'
    })
  })
}


function base_dir( name ) {
  return path.join( config.base_dir, name );
}


vows.describe( 'application' ).addBatch({
  'Application' : {

    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    '.name' : function ( app ) {
      assert.equal( app.name, config.name );
      assert.isReadOnly( app, 'name' )
    },

    '.base_dir' : function ( app ) {
      assert.equal( app.base_dir, config.base_dir );
      assert.isReadOnly( app, 'base_dir' )
    },

    '.is_running' : function( app ){
      assert.isReadOnly( app, 'is_running' );
    },

    '.default_controller' : function( app ){
      assert.equal( app.default_controller, config.default_controller );
      assert.equal( tests_tools.get_new_app().default_controller, 'action' );
    },

    '.path_to_models' : function( app ){
      assert.equal( app.path_to_models, base_dir( 'models' ) );
      assert.isReadOnly( app, 'path_to_models' )
    },

    '.path_to_controllers' : function( app ){
      assert.equal( app.path_to_controllers, base_dir( 'controllers' ) );
      assert.isReadOnly( app, 'path_to_controllers' )
    },

    '.path_to_components' : function( app ){
      assert.equal( app.path_to_components, base_dir( 'components' ) );
      assert.isReadOnly( app, 'path_to_components' )
    },

    '.path_to_views' : function( app ){
      assert.equal( app.path_to_views, base_dir( 'views' ) );
      assert.isReadOnly( app, 'path_to_components' )
    },

    'custom paths' : function(  ){
      throw 'no test';
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

    '.views loaded' : function(  ){
      throw 'no test';
    },

    '.tools' : function( app ){
      assert.equal( app.tools, require( 'autodafe/framework/lib/tools' ) );
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
          var app = this.context.topics[ 1 ];
          assert.equal( test_model.me(), app.models.test_model.me() );
        }
      },

      'new test_model' : {
        topic : function( app ){
          return new app.models.test_model;
        },

        'should be instance of model class' : function( test_model ){
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
      }
    },

    '.construct()' : function(){
      // without name
      assert.throws( function() {
        Autodafe.create_application({
          base_dir : '.'
        });
      } );

      // without base_dir
      assert.throws( function() {
        Autodafe.create_application({
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

    'get param from application without params' : function(){
      throw 'no test';
    },

    '.load_views()' : function(  ){
      throw 'no test';
    },

    '.run() before' : function( app ) {
      var new_app = tests_tools.get_new_app();
      assert.isFalse( new_app.is_running );

      assert.isTrue( new_app.run() );
      assert.isFalse( new_app.is_running );  // async run
      assert.isFalse( new_app.run() );       // try to double run
    },

    '.run()' : {
      topic : function(){
        tests_tools.get_new_app().run( this.callback );
      },
      'after' : function( err, app ){
        var double_run = false;

        app.on( 'run', function() {
          double_run = true;
        } );

        assert.isFalse( app.run() ); // double run after init
        assert.isFalse( double_run );
        assert.isTrue( app.is_running );
      }
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

      // todo: delete this topic, it's tmp fix for vows
      topic : function( app ){
        return app;
      },

      'simple registering' : function( app ){
        var component = new autodafe.Component({
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
            new autodafe.Component({
              name : 'test',
              app  : app
            })
          );
        } );
      },

      'component with conflict name which is application property or method name' : function( app ){
        assert.throws( function() {
          app.register_component(
            new autodafe.Component({
              name  : 'default_controller',
              app   : app
            })
          );
        } );
      }
    },

    '.get_session()' : {

      // todo: delete this topic, it's tmp fix for vows
      topic : function( app ){
        return app;
      },


      '`new_session` event' : function( app ) {
        var new_session_emitted = false;

        app.once( 'new_session', function() {
          new_session_emitted = true;
        } );

        module.client  = get_client( app );
        module.session = app.get_session( 1, module.client );

        assert.isTrue( new_session_emitted );
        assert.instanceOf( module.session, Session );
        assert.equal( module.session.id, 1 );
        assert.lengthOf( module.session.clients, 1 );

      },

      'get session with same id' : function( app ) {
        var new_session_emitted = false;

        app.once( 'new_session', function() {
          new_session_emitted = true;
        } );

        module.client2  = get_client( app );
        module.session2 = app.get_session( 1, module.client2 );

        assert.isTrue( new_session_emitted );
        assert.equal( module.session, module.session2 );
        assert.equal( module.session.id, 1 );
        assert.lengthOf( module.session.clients, 2 );
      },

      'close session' : function( app ){
        module.session.close();
        var session
        assert.notEqual( module.session, session = app.get_session( 1, module.client ) );

        assert.lengthOf( session.clients, 1 );
      }
    },

    '.stop() should just emit stop event' : function( app ){
      var stop_emitted = false;
      app.on( 'stop', function(){
        stop_emitted = true;
      } );
      app.stop();
      assert.isTrue( stop_emitted );
    }
  },

  'creating minimalistic application' : {

    topic : function(){
      var config = require( 'autodafe/tests/applications/mini_app/config.js' );
      tests_tools.get_new_app( config, {
        create_callback : this.callback
      } );
    },

    'should work without any errors' : function( err, app ){
      assert.isNull( err );
      assert.instanceOf( app, Application );
    },

    'and run it' : {
      topic : function( app ){
        app.run( this.callback );
      },

      'should work' : function( err, app ){
        assert.isNull( err );
        assert.instanceOf( app, Application );
      }
    }
  },

  'changing default controller ' : function(  ){
    throw( 'no tests' );
  }
}).export( module );