var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

vows.describe( 'controller' ).addBatch({

  'Application' : {
    topic : function(){
      return tests_tools.create_normal_application( this.callback );
    },

    '.test_controller' : {

      topic : function( app ) {
        return app.router.get_controller('test');
      },

      'should be instance of TestController' : function( controller ) {
        var TestController = require('autodafe/tests/applications/normal_app/controllers/test');
        assert.instanceOf( controller, TestController );
      },

      '.name of controller should be' : {

        'equal "test"' : function( controller ) {
          assert.equal( controller.name, 'test' );
        },

        'read only' : function( controller ){
          assert.isReadOnly( controller, 'name' );
        },

        'required' : function(){
          var app = this.context.topics[ 1 ];

          assert.throws( function() {
            new autodafe.Controller({
              app : app
            });
          } );
        }
      },

      '.default_action should be "index"' : function( controller ){
        assert.equal( controller.default_action, 'index' );
      },

      '.default_action should be fired by default' : function( controller ){
        var index_action_has_run = false;

        controller.once( 'action', function( action ) {
          index_action_has_run = action == 'index';
        } );
        controller.run_action();

        assert.isTrue( index_action_has_run );
      },

      '.models should be Application.models' : function( controller ){
        assert.equal( controller.models, this.context.topics[1].models );
      },

      '.run_action which is not exist should throw Error' : function( controller ){
        assert.throws( function() {
          controller.run_action( 'not_existed_action' );
        }, Error );
      },

      '.before_action should stop action running if it returns false' : function( controller ){
        var test_action_has_run = false;

        controller.before_action = function(){
          return false;
        }

        controller.once( 'test', function() {
          test_action_has_run = true;
        } );

        controller.run_action( 'test' );
        assert.isFalse( test_action_has_run );

        controller.before_action = controller.constructor.prototype.before_action;

        controller.run_action( 'test' );
        assert.isTrue( test_action_has_run );
      },

      '.before_action should change arguments for action if it returns array' : function( controller ){
        var action_args;
        var after_action_args;

        controller.once( 'test', function( args ) {
          action_args = args;
        } );

        controller.once( 'after_action', function( args ) {
          after_action_args = args;
        } );

        controller.before_action = function(){
          return [ 1, 2 ];
        }

        controller.run_action( 'test' );

        assert.deepEqual( Array.prototype.slice.call( action_args, 0 ), [ 1, 2 ] );
        assert.deepEqual( Array.prototype.slice.call( after_action_args, 0 ), [ 'test', 1, 2 ] );

        controller.before_action = controller.constructor.prototype.before_action;
      },

      '.render' : {
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
      },

      '.connect_client' : function(){
        throw 'no test';
      },

      '.send_response' : function(){
        throw 'no test';
      },

      '.create_url' : function(){
        throw 'no test';
      },

      '.create_widget' : function(){
        throw 'no test';
      }
    }
  }
}).export( module );