exports.get_batch = function( application, assert ) {
  var Controller  = global.autodafe.Controller;

  return {
    topic : function() {
      var TestController = require('autodafe/tests/test_app/controllers/test');
      return new TestController({
        app   : application,
        name  : 'test'
      });
    },
    'instance test' : function( controller ) {
      assert.instanceOf( controller, Controller );
    },
    'name of controller should be' : {
      'equal "test"' : function( controller ) {
        assert.equal( controller.name, 'test' );
      },
      'read only' : function( controller ){
        assert.isReadOnly( controller, 'name' );
      },
      'required' : function(){
        assert.throws( function() {
          new Controller({
            app : application
          });
        } );
      }
    },
    'default action should be "index"' : function( controller ){
      assert.equal( controller.default_action, 'index' );
    },
    'views path should be "views"' : function( controller ){
      assert.equal( controller.views_path, 'views' );
    },
    
    'tests default action' : function( controller ){
      var index_action_has_run = false;

      controller.once( 'index action', function() {
        index_action_has_run = true;
      } );
      controller.run_action();

      assert.isTrue( index_action_has_run );
    },
    'tests existed action without arguments' : function( controller ){
      var test_action_has_run = false;
      var action_args;

      controller.once( 'test action', function( args ) {
        test_action_has_run = true;
        action_args         = args;
      } );
      controller.run_action( 'test' );

      assert.isTrue( test_action_has_run );
      assert.isEmpty( action_args );
    },
    'tests existed action with arguments' : function( controller ){
      var test_action_has_run = false;

      var test_args = [ 0, false, null, 42, undefined ];
      var action_args;

      controller.once( 'test action', function( args ) {
        test_action_has_run = true;
        action_args = args;
      } );

      // send copy of array
      var args = [ 'test' ].concat( test_args );
      controller.run_action.apply( controller, args );

      assert.isTrue( test_action_has_run );

      // args is not array
      assert.deepEqual( Array.prototype.slice.call( action_args, 0 ), test_args );
    },
    'tests declared unimplemented action' : function( controller ){
      assert.throws( function() {
        controller.run_action( 'not_existed_test_action' );
      }, Error );
    },
    'tests implemented undeclared action' : function( controller ){
      var undeclared_action_has_run = false;

      controller.once( 'some implemented action', function( args ) {
        undeclared_action_has_run = true;
      } );

      assert.throws( function() {
        controller.run_action( 'some_implemented_action' );
      }, Error );

      assert.isFalse( undeclared_action_has_run, 'Undeclared actions must not be run' );
    },
    'allow and deny actions' : function( controller ){
      var test_action_has_run = false;

      controller.on( 'some implemented action', function( args ) {
        test_action_has_run = true;
      } );

      controller.run_action( 'some_implemented_action' );
      assert.isTrue( test_action_has_run );

      test_action_has_run = false;

      assert.throws( function() {
        controller.run_action( 'some_implemented_action' );
      } );
      assert.isFalse( test_action_has_run );
    },
    'tests "before_action" arguments' : function( controller ){
      var before_action_has_run = false;
      var before_action_args;

      controller.once( 'before_action', function( args ) {
        before_action_has_run = true;
        before_action_args    = args;
      } );

      var args = [ 'test', 42 ];
      controller.run_action.apply( controller, args );
      assert.isTrue( before_action_has_run );
      assert.deepEqual( Array.prototype.slice.call( before_action_args, 0 ), args );
    },
    'tests "before_action" returning false: do not run action' : function( controller ) {
      var test_action_has_run = false;

      controller.once( 'test action', function() {
        test_action_has_run = true;
      } );
      controller.run_action( 'test', 'do not run' );

      assert.isFalse( test_action_has_run );
    },
    'tests "after action"' : function( controller ){
      var after_action_has_run = false;
      var after_test_action_args;

      controller.once( 'after_action', function( args ) {
        after_action_has_run = true;
        after_test_action_args = args;
      } );

      var args = [ 'test', 42 ];
      controller.run_action.apply( controller, args );
      assert.isTrue( after_action_has_run );
      assert.deepEqual( Array.prototype.slice.call( after_test_action_args, 0 ), args );
    },
    'tests "before_action" returning array: change args for action' : function( controller ){
      var test_action_has_run   = false;
      var after_action_has_run  = false;
      var test_action_args;
      var after_test_action_args;

      controller.once( 'test action', function( args ) {
        test_action_has_run = true;
        test_action_args    = args;
      } );

      controller.once( 'after_action', function( args ) {
        after_action_has_run    = true;
        after_test_action_args  = args;
      } );

      controller.run_action( 'test', 'change args' );

      assert.isTrue( test_action_has_run );
      assert.deepEqual( Array.prototype.slice.call( test_action_args, 0 ), [ 1, 2 ] );
      assert.deepEqual( Array.prototype.slice.call( after_test_action_args, 0 ), [ 'test', 1, 2 ] );
    },
    'views' : {
      topic : function( controller ){
        controller.render( 'test.json', { message : 'ok' }, this.callback );
      },
      'json' : function( err, data ) {
        assert.isNull( err );

        var a;
        assert.doesNotThrow( function() {
          eval( 'a = ' + data );
        } );
        assert.deepEqual( a, {
          test : 'ok'
        } );
      }
    }
  }
}