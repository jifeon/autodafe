exports.get_batch = function( application, assert ){
  var TestModel = require( 'autodafe/tests/test_app/models/test_model' );
  var Model     = global.autodafe.Model;

  return {
    'raw model - ' : {
      topic : function() {
        return new TestModel({
          app : application
        });
      },
      '`model` should be instance of Model and TestModel' : function( model ){
        assert.instanceOf( model, Model );
        assert.instanceOf( model, TestModel );
      },
      'get attributes without list of it\'s names' : function( model ){
        model.set_attribute( 'param2', 42 );
        model.set_attribute( 'param3', false );

        assert.deepEqual( model.get_attributes(), {
          param2 : 42,
          param3 : false
        } );

        assert.isFalse( model.get_attribute( 'param3' ) );
      },
      'attributes should not influence to own model\'s properties' : function( model ) {
        assert.isUndefined( model.param2 );
        assert.isUndefined( model.param3 );
      },
      'if model has own property with same name of attribute, `set_attribute` should set the property' : function( model ){
        model.set_attribute( 'param1', 111 );
        assert.equal( model.param1, 111 );
      },
      'get attributes by name' : function( model ){
        assert.deepEqual( model.get_attributes( [ 'param1', 'param2', 'not_existed' ] ), {
          param1      : 111,
          param2      : 42,
          not_existed : null
        } );
      },
      'get single attribute' : function( model ){
        assert.equal( model.get_attribute( 'param1' ), 111 );   // from own property
        assert.equal( model.get_attribute( 'param2' ), 42 );    // from attributes
        assert.equal( model.get_attribute( 'not_existed' ), null );   // not existed
      },
      'context in attribute which is function should be the current model' : function( model ){
        assert.equal( model.get_attribute( 'me' )(), model );
      },
      'get safe attributes' : function( model ){
        assert.deepEqual( model.get_safe_attributes_names(), [ 'param1', 'param2' ] );
      },
      '`set_attributes` shoud throws if attributes is not an Object' : function( model ){
        assert.throws( function() {
          model.set_attributes( null );
        } );
      },
      '`set_attributes` should set only safe attributes' : function( model ){
        var param = model.param;

        var test_log_route            = application.log_router.get_route( 'test' );
        var unsafe_attribute_names    = [];
        var unsafe_attribute_values   = [];

        model.on( 'set_unsafe_attribute', function( name, value ) {
          unsafe_attribute_names.push( name );
          unsafe_attribute_values.push( value );
        } );

        var messages = test_log_route.grep_messages( function() {
          model.set_attributes({
            param   : 32,
            param1  : 68,
            param2  : false,
            param3  : null
          });
        } );

        assert.deepEqual( unsafe_attribute_names, [ 'param', 'param3' ] );
        assert.deepEqual( unsafe_attribute_values, [ 32, null ] );
        assert.lengthOf( messages, 2 );
        assert.equal( messages[0].level, 'warning' );
        assert.equal( messages[1].level, 'warning' );

        assert.equal( model.param,  param );
        assert.equal( model.param1, 68 );
        assert.isFalse( model.get_attribute( 'param2') );
        assert.isFalse( model.get_attribute( 'param3') );
      }
    }
  }
}