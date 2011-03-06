exports.add_tests_to = function( suite ){
  var TestModel = require( 'models/test_model' );
  var Model     = require( 'model' );
  var assert    = require( 'assert' );

  suite.addBatch({
    'model tests' : {
      topic : new TestModel,
      'instance test' : function( model ){
        assert.instanceOf( model, Model );
        assert.instanceOf( model, process.EventEmitter );
      },
      'link to application' : function( model ) {
        assert.equal( model.app, suite.application );
      },
      'link to application is read only' : function( model ) {
        assert.throws( function() {
          model.app = {};
        }, TypeError );
      }
    }
  });
}