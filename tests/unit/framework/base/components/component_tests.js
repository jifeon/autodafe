exports.get_batch = function( application, assert ) {
  var Component = global.autodafe.Component;

  return {
    topic : application,
    'wrong component creation without name' : function( app ) {
      assert.throws( function() {
        new Component({
          app : app
        });
      } );
    },
    'normal component -' : {
      topic : function( app ) {
        return new Component({
          name : 'test',
          app  : app
        });
      },
      'property `name` should be' : {
        'equal "test"' : function( component ){
          assert.equal( component.name, 'test' );
        },
        'read only' : function( component ){
          assert.isReadOnly( component, 'name' );
        }
      },
      '`get` method' : function( component ){
        assert.equal( component.get(), component );
      }
    }
  }
}