var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var AppModule = require( 'autodafe/framework/base/app_module' );

vows.describe( 'app_module' ).addBatch({
  'Application' : {
    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    'AppModule' :  {
      topic : function( app ){
        return new AppModule({
          app : app
        });
      },

      '.app should be read only link to application' : function( app_module ){
        var app = this.context.topics[1];
        assert.equal( app_module.app, app );
        assert.isReadOnly( app_module, 'app' );
      },

      '.log()' : function( app_module ){
        var app             = this.context.topics[1];
        var test_log_route  = app.log_router.get_route( 'test' );
        var message         = test_log_route.get_first_message( function() {
          app_module.log( 'test', 'warning' );
        } );

        assert.isNotNull( message );
        assert.equal( message.text,   'test' );
        assert.equal( message.level,  'warning' );
        assert.equal( message.module, 'AppModule' );
      },

      '.default_callback()' : {

        'should not throw any error if first argument null or undefined' : function( app_module ){
          assert.doesNotThrow( function() {
            app_module.default_callback();
            app_module.default_callback( null );
            app_module.default_callback( null, 'result' );
          } );
        },

        'should throw a first argument if it is' : {
          'error' : function( app_module ) {
            assert.throws( function() {
              app_module.default_callback( new Error );
            } );
          },
          'not a null or undefined' : function( app_module ) {
            assert.throws( function() {
              app_module.default_callback( 42 );
            } );
          }//,
          // node bug - false does not throw
//          'equal false' : function( app_module ) {
//            assert.throws( function() {
//              app_module.default_callback( false );
//            } );
//          }
        }
      },

      '.t() is stub for feature i18l' : function( app_module ){
        assert.equal( app_module.t( 'some text' ), 'some text' );
      }
    },

    'creating app_module without link to application should throw an error' : function(){
      assert.throws( function() {
        new AppModule;
      });
    },

    'initialization bad declared class inherited from AppModule should log a warning' : function( e, app ){
      var Class = function( params ) {
        this._init( params );
      }

      Class.inherits( AppModule );

      var test_log_route  = app.log_router.get_route( 'test' );
      var message = test_log_route.get_first_message( function() {
        new Class({
          app : app
        });
      } );

      assert.isNotNull( message );
      assert.equal( message.level,  'warning' );
    },

    'initialization class inherited from AppModule' : function( e, app ){
      function Class( params ) {
        this._init( params );
      }

      Class.inherits( AppModule );

      var inst;

      var test_log_route  = app.log_router.get_route( 'test' );
      var message = test_log_route.get_first_message( function() {
        inst = new Class({
          app : app
        });
      } );

      assert.isNull( message );
      assert.equal( inst.class_name, 'Class' );
    }
  }
}).export( module );