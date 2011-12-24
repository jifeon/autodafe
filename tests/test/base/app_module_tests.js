var vows      = require( 'autodafe/node_modules/vows' );
var assert    = require( 'assert' );

var Autodafe  = require( 'autodafe' );
var AppModule = require( 'autodafe/framework/base/app_module' );


//var test_log_route  = application.log_router.get_route( 'test' );


vows.describe( 'app_module' ).addBatch({
  '' :  {
    topic : new AppModule({
      app : null,//application
    }),
    'link to application' : function( app_module ){
      assert.equal( app_module.app, application );
      assert.isReadOnly( app_module, 'app' );
    },
    '`log` method' : function( app_module ){
      var message = test_log_route.get_first_message( function() {
        app_module.log( 'test', 'warning' );
      } );

      assert.isNotNull( message );
      assert.equal( message.text,   'test' );
      assert.equal( message.level,  'warning' );
      assert.equal( message.module, 'AppModule' );
    },
    'creating app_module without link to application should throw an error' : function(){
      assert.throws( function() {
        new AppModule;
      });
    },
    'initialization bad declared class inherited from AppModule should log a warning' : function(){
      var Class = function( params ) {
        this._init( params );
      }

      Class.inherits( AppModule );

      var message = test_log_route.get_first_message( function() {
        new Class({
          app : application
        });
      } );

      assert.isNotNull( message );
      assert.equal( message.level,  'warning' );
    },
    'initialization class inherited from AppModule' : function(){
      function Class( params ) {
        this._init( params );
      }

      Class.inherits( AppModule );

      var inst;
      var message = test_log_route.get_first_message( function() {
        inst = new Class({
          app : application
        });
      } );

      assert.isNull( message );
      assert.equal( inst.class_name, 'Class' );
    },
    '`default_callback` method' : {
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
        },
        'equal false' : function( app_module ) {
          assert.throws( function() {
            app_module.default_callback( false );
          } );
        }
      }

    }
  }
});