exports.get_batch = function( application, assert ) {
  var Component = require('components/component');

  return {
    topic : application,
    'wrong component creation' : {
      'without name' : function( app ) {
        assert.throws( function() {
          new Component({
            app : app
          });
        } );
      },
      'component with same name' : function( app ) {
        new Component({
          name  : 'test2',
          app   : app
        });

        assert.throws( function() {
          new Component({
            name  : 'test2',
            app   : app
          });
        } );
      },
      'component with conflict name' : {
        'which is application property or method name' : function( app ){
          assert.throws( function() {
            new Component({
              name  : 'default_controller',
              app   : app
            });
          } );
        }
      }
    },
    'normal component' : {
      topic : function( app ) {
        return new Component({
          name : 'uniq',
          app  : app
        });
      },
      'public properties' : {
        '`name` is "uniq"' : function( component ){
           assert.equal( component.name, 'uniq' );
        }
      },
      'link to component from application' : function( component ) {
        assert.equal( component, application[ component.name ] );
      }
    }
  }
}