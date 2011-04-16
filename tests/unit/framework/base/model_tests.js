exports.get_batch = function( application, assert ){
  var TestModel = require( 'models/test_model' );
  var Model     = require( 'model' );

  return {
    topic : function() {
      return new application.models.test_model;
    },
    'instance test' : function( model ){
      assert.instanceOf( model, Model );
      assert.instanceOf( model, TestModel );
    }
  }
}