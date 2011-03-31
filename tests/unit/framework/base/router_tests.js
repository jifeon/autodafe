exports.get_batch = function( application, assert ) {
  var Router          = require('router');
  var Autodafe        = require('autodafe');
  var path            = require('path');
  var TestController  = require('controllers/test');

  var single_route_test = function( route ) {
    return function( router ) {
      var test_action_is_fired = false;
      var args_in_action;
      var args_to_route = [ 42, false, null, undefined, "string" ];

      router.app.once( 'test.test', function( args ) {
        test_action_is_fired = true;
        args_in_action = Array.prototype.slice.call( args, 0 );
      } );

      args_to_route.unshift( route );
      router.route.apply( router, args_to_route );
      args_to_route.shift();

      assert.isTrue( test_action_is_fired );
      assert.deepEqual( args_in_action, args_to_route );
    }
  };

  var multi_route_test = function( route, last_action_must_be_fired ) {
    return function( router ) {
      var fired_actions_count = 0;
      var args_in_action_1;
      var args_in_action_2;
      var args_to_route = [ 42, false, null, undefined, "string" ];

      router.app.once( 'test.test', function( args ) {
        fired_actions_count++;
        args_in_action_1 = Array.prototype.slice.call( args, 0 );
      } );

      router.app.once( 'another_test.test', function( args ) {
        fired_actions_count++;
        args_in_action_2 = Array.prototype.slice.call( args, 0 );
      } );

      args_to_route.unshift( route );
      router.route.apply( router, args_to_route );
      args_to_route.shift();

      assert.equal( fired_actions_count, last_action_must_be_fired ? 2 : 1 );
      assert.deepEqual( args_in_action_1, args_to_route );
      if ( last_action_must_be_fired ) assert.deepEqual( args_in_action_2, args_to_route );
    }
  }

  return {
    topic : application.router,
    'instance test' : function( router ) {
      assert.instanceOf( router, Router );
    },
    '`get_controller` method' : {
      topic : function( router ) {
        return router.get_controller('test');
      },
      'instance test' : function( test_controller ){
        assert.instanceOf( test_controller, TestController );
      }
    },
    '`route` method' : {
      'sample single route'                       : single_route_test( 'test.test' ),
      'single route from rules'                   : single_route_test( 'single_route_rule' ),
      'multi route from rules'                    : multi_route_test( 'multi_route_rule', true ),
      'second rule route to unimplemented action' : multi_route_test( 'rule_with_unimplemented_test_action', false ),
      'second rule route to undeclared action'    : multi_route_test( 'rule_with_undeclared_test_action', false ),
      'second rule route to unexist controller'   : multi_route_test( 'rule_with_unexist_controller', false )
    },
    'bad controllers' : {
      topic : function() {
        var config = require( path.resolve('../router_test_app/config/main') );
        var app    = Autodafe.create_application( config );
        app.run();
        return app;
      },
      'tests good controller in folder with bad controllers' : function( app ) {
        var runned_action_in_good_controller = false;

        app.on( 'good.test', function() {
          runned_action_in_good_controller = true;
        } );
        app.router.route( 'good.test' );

        assert.isTrue( runned_action_in_good_controller );
      },
      'only one controller must be included' : function( app ) {
        assert.equal( Object.keys( app.router.get_controllers() ).length, 1 );
      }
    }
  }
}