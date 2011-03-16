exports.add_tests_to = function( suite ){
  var TestModel = require( 'models/test_model' );
  var Model     = require( 'model' );
  var assert    = require( 'assert' );

  suite.addBatch({
    'model tests' : {
      topic : new suite.application.model( TestModel ),
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
  });
}