exports.add_tests_to = function( suite ) {
  var assert    = require('assert');
  var Router    = require('router');
  var Autodafe  = require('autodafe');

  suite.addBatch({
    'router tests' : {
      topic : suite.application.router,
      'instance test' : function( router ) {
        assert.instanceOf( router, Router );
      },
      'link to application' : function( router ) {
        assert.equal( router.app, suite.application );
      },
      'link to application is read only' : function( router ){
        assert.throws( function(){
          router.app = {};
        }, TypeError );
      },
      'bad controllers' : {
        topic : function() {
          var config = {
            name      : 'app_with_bad_controllers',
            base_dir  : path.resolve('../router_test_app')
          }

          return config;
        }
      }
    }
  });
}