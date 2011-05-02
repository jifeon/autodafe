exports.get_batch = function( application, assert ) {
  var AppModule       = require('app_module');

  var test_log_route  = application.log_router.get_route( 'test' );

  return {
    topic : new AppModule({
      app : application
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
    }
  }
}