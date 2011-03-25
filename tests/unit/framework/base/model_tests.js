exports.get_batch = function( application, assert ){
  var TestModel = require( 'models/test_model' );
  var Model     = require( 'model' );

  return {
    topic : new application.model( TestModel ),
    'instance test' : function( model ){
      assert.instanceOf( model, Model );
      assert.instanceOf( model, process.EventEmitter );
    },
    'creating model without link to application in params must throw an Error' : function(){
      assert.throws( function() {
        new Model
      } );
    }
  }
}