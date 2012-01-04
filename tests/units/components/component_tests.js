var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

vows.describe( 'component' ).addBatch({

  'After creating application' : {
    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    'wrong component creation without name' : function( app ) {
      assert.throws( function() {
        new autodafe.Component({
          app : app
        });
      } );
    },

    'and component' : {
      topic : function( app ) {
        return new autodafe.Component({
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

      '`get` method should return himself' : function( component ){
        assert.equal( component.get(), component );
      }
    }
  }
}).export( module );