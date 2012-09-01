var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var Request     = require('autodafe/framework/client_connections/http/http_request');


function route_test( url, test_action, test_params, waited_params, query_params ) {
  waited_params = waited_params || test_params;
  query_params  = query_params  || {};

  return {
    topic : function( app ) { return app; },
    'test' : function( app ){
      var fake_request = {
        method  : query_params.type || 'get',
        headers : {
          host : query_params.host || 'localhost'
        },
        url : url
      };

      var request = new Request({
        app     : app,
        request : fake_request,
        params  : test_params
      });
      var good   = app.router.get_controller( 'good' );
      var action = null;
      var params = null;

      good.once( 'action', function( act, act_params ){
        action = act;
        params = act_params;
      } );

      app.router.route( request );

      assert.equal( action, test_action );
      assert.deepEqual( params, waited_params );
    }
  }
}


function route_error_test( url, params, num ){
  return {
    topic : function( app ) { return app; },
    'should throw error 404' : function( app ){
      var request = new global.autodafe.cc.Request( {
        app     : app,
        action  : url,
        params  : params || null
      } );

      var error = null;
      try {
        app.router.route( request );
      }
      catch(e) { error = e; }

      assert.isError( error );
      assert.equal( error.number, num || 404 );
    }
  }
}


function create_url( path, params, url ) {
  return function( app ){
    assert.equal( app.router.create_url( path, params, 'good', 'index' ), url );
  }
}


var action_params = { number : 42, text : 'text' };


vows.describe( 'components manager' ).addBatch({

  'Router Application' : {
    topic : function(){
      var config = require( 'autodafe/tests/applications/router_test_app/config/working_config' );
      tests_tools.get_new_app( config, {
        create_callback : this.callback
      } );
    },

    '.get_controller' : function( app ){
      var GoodController = require( 'autodafe/tests/applications/router_test_app/controllers/good' );
      assert.instanceOf( app.router.get_controller( 'good' ), GoodController );
      assert.isNull( app.router.get_controller( 'blank' ) );
      assert.isNull( app.router.get_controller( 'not_controller' ) );
    },

    '.route' : {
      'good.index'                      : route_test( '/',            'index',  action_params ),
      'good.action without params'      : route_test( '/action',      'action', null, {} ),
      'good.action with number'         : route_test( '/action',      'action', { number : 42 } ),
      'good.action with number in path' : route_test( '/action/42',   'action', null, { number : 42 } ),
      'good.action with string'         : route_test( '/action',      'action', { text : 'text' } ),
      'good.action with string in path' : route_test( '/action/text', 'action', null, { text : 'text' } ),
      'good.action with params'         : route_test( '/action',      'action', action_params ),
      'good.action with params in path' : route_test( '/action/42',   'action', { text : 'text' }, action_params ),
      'good.remove by delete query'     : route_test( '/remove',      'remove', null, {}, { type : 'delete' } ),
      'good.remove by post query'       : route_test( '/remove',      'remove', null, {}, { type : 'post' } ),
      'good.domain_index'               : route_test( '/',            'domain_index', action_params, null, { host : 'domain.com' } ),
      'good.domain_action'              : route_test( '/action/42/text', 'domain_action', null, action_params, { host : 'domain.com:3000' } ),

      'good.do without param'           : route_error_test( '/do' ),
      'good.bad_action'                 : route_error_test( '/bad_action_in_good', null, 500 ),
      'no_controller.action'            : route_error_test( '/bad_action' )
    },

    '.create_url' : {
      topic : function( app ) { return app; },
      'to root'                       : create_url( 'good.index',  null, '/' ),
      'to action'                     : create_url( 'good.action', null, '/action' ),
      'to action with text'           : create_url( 'good.action', { text : 'text' }, '/action/text' ),
      'to action with number'         : create_url( 'good.action', { number : 42 }, '/action/42' ),
      'to action: choose relevant'    : create_url( 'good.action', { number : 42, some_param : 5 }, '/action/42/5' ),
      'to action with text and some_param'
                                      : create_url( 'good.action', { text : 'text', some_param : 5 }, '/action/text?some_param=5' ),
      'to domain_action with text and number'
                                      : create_url( 'good.domain_action', { text : 'text', number : 42 }, '/action/42/text' ),
      'to remove'                     : create_url( 'good.remove', null, '/remove' ),
      'to domain_index'               : create_url( 'good.domain_index', null, '/' )
    },

    '.add_controller' : {
      topic : function( app ) { return app; },

      'by local path' : function( app ){
        app.router.add_controller( 'out_of_config_folder/out' );
        assert.instanceOf( app.router.get_controller( 'out' ), autodafe.Controller );
      },

      'by global path' : function( app ){
        app.router.add_controller( require('path').join( app.base_dir, 'out_of_config_folder/out2' ) );
        assert.instanceOf( app.router.get_controller( 'out2' ), autodafe.Controller );
      },

      'by constructor' : function( app ){
        var SomeController = require( require('path').join( app.base_dir, 'out_of_config_folder/out2' ));
        app.router.add_controller( SomeController, 'some' );
        assert.instanceOf( app.router.get_controller( 'some' ), SomeController );
      },

      'by constructor without name' : function( app ){
        var SomeController = require( require('path').join( app.base_dir, 'out_of_config_folder/out2' ));
        assert.throws(function(){
          app.router.add_controller( SomeController );
        })
      },

      'without params' : function( app ){
        assert.throws(function(){
          app.router.add_controller();
        })
      }
    },

    '.add_route' : function( app ){
      var good = app.router.get_controller( 'good' );
      good.new_action = function(){};

      app.router.add_rule( '/new_action/<param:\\w+>', 'good.new_action' );

      var action = null;
      var params = null;

      good.once( 'action', function( act, act_params ){
        action = act;
        params = act_params;
      } );

      app.router.route( new global.autodafe.cc.Request({
        action : '/new_action/text',
        app    : app
      }) );

      assert.equal( action, 'new_action' );
      assert.deepEqual( params, { param : 'text' } );
      assert.equal( app.router.create_url( 'good.new_action', { param : 'param' } ), '/new_action/param' );
    }
  },

  'Router Application with text file instead of controller' : {
    topic : function(){
      var config = require( 'autodafe/tests/applications/router_test_app/config/crashing_config' );
      tests_tools.get_new_app( config, {
        create_callback : this.callback
      } );
    },
    'should callback an error' : function( err, app ){
      assert.isError( err );
    }
  },

  'Router Application with broken controller' : {
    topic : function(){
      var config = require( 'autodafe/tests/applications/router_test_app/config/crashing_config2' );
      tests_tools.get_new_app( config, {
        create_callback : this.callback
      } );
    },
    'should callback an error' : function( err, app ){
      assert.isError( err );
    }
  }
}).export( module );