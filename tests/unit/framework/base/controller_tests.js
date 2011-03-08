exports.add_tests_to = function( suite ) {
  var assert      = require('assert');

  var Controller  = require( 'controller' );
  var AWarning    = require( 'awarning' );

  suite.addBatch({
    'controller tests' : {
      topic : function() {
        var TestController = require('controllers/test');
        return new TestController({
          app : suite.application
        });
      },
      'instance test' : function( controller ) {
        assert.instanceOf( controller, Controller );
      },
      'name of controller must be "test"' : function( controller ) {
        assert.equal( controller.name, 'test' );
      },
      'actions is an array' : function( controller ) {
        assert.isArray( controller.actions );
      },
      'default action is "index"' : function( controller ){
        assert.equal( controller.default_action, 'index' );
      },
      'tests application link' : function( controller ){
        assert.equal( controller.app, suite.application );
      },
      'tests default action' : function( controller ){
        var index_action_has_runned = false;

        controller.once( 'index action', function() {
          index_action_has_runned = true;
        } );
        controller.run_action();

        assert.isTrue( index_action_has_runned );
      },
      'tests existed action without arguments' : function( controller ){
        var test_action_has_runned = false;

        controller.once( 'test action', function( args ) {
          test_action_has_runned = true;
          assert.isEmpty( args );
        } );
        controller.run_action( 'test' );

        assert.isTrue( test_action_has_runned );
      },
      'tests existed action with arguments' : function( controller ){
        var test_action_has_runned = false;

        var test_args = [ 0, false, null, 42, undefined ];
        controller.once( 'test action', function( args ) {
          test_action_has_runned = true;
          // args is not array
          assert.deepEqual( Array.prototype.slice.call( args, 0 ), test_args );
        } );

        // send copy of array
        controller.run_action( 'test', test_args.slice(0) );

        assert.isTrue( test_action_has_runned );
      },
      'tests declared unimplemented action' : function( controller ){
        assert.throws( function() {
          controller.run_action( 'unexist_test_action' );
        }, AWarning );
      },
      'tests implemented undeclared action' : function( controller ){
        var undeclared_action_has_runned = false;

        controller.once( 'some implemented action', function( args ) {
          undeclared_action_has_runned = true;
        } );

        assert.throws( function() {
          controller.run_action( 'some_implemented_action' );
        }, AWarning );

        assert.isFalse( undeclared_action_has_runned, 'Undeclared actions must not be runned' );
      },
      'tests "before_action" arguments' : function( controller ){
        var before_action_has_runned = false;

        controller.once( 'before_action', function( args ) {
          before_action_has_runned = true;
          assert.deepEqual( Array.prototype.slice.call( args, 0 ), [ 'test', 42 ] );
        } );

        controller.run_action( 'test', [ 42 ] );
        assert.isTrue( before_action_has_runned );
      },
      'tests "before_action" returning false: do not run action' : function( controller ) {
        var test_action_has_runned = false;

        controller.once( 'test action', function() {
          test_action_has_runned = true;
        } );
        controller.run_action( 'test', [ 'do not run' ] );

        assert.isFalse( test_action_has_runned );
      },
      'tests "before_action" returning array: change args for action' : function( controller ){
        var test_action_has_runned = false;

        controller.once( 'test action', function( args ) {
          test_action_has_runned = true;
          assert.deepEqual( Array.prototype.slice.call( args, 0 ), [ 1, 2 ] );
        } );
        controller.run_action( 'test', [ 'change args' ] );

        assert.isTrue( test_action_has_runned );
      },
      'tests "after action"' : function( controller ){
        var after_action_has_runned = false;

        controller.once( 'after_action', function( args ) {
          after_action_has_runned = true;
          assert.deepEqual( Array.prototype.slice.call( args, 0 ), [ 'test', 42 ] );
        } );

        controller.run_action( 'test', [ 42 ] );
        assert.isTrue( after_action_has_runned );
      }
    }
  });
}