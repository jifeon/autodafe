exports.get_batch = function( application, assert ) {
  var Component = require('components/component');

  return {
    topic : application,
    'wrong component creation without name' : function( app ) {
      assert.throws( function() {
        new Component({
          app : app
        });
      } );
    },
    'normal component' : {
      topic : function( app ) {
        return new Component({
          name : 'test',
          app  : app
        });
      },
      'public properties' : {
        '`name` is "test"' : function( component ){
           assert.equal( component.name, 'test' );
        }
      },
      '`get` method' : function( component ){
        assert.equal( component.get(), component );
      }
    }
  }
}