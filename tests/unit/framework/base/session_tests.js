exports.get_batch = function( application, assert ) {
  var Session = require('session');

  return {
    topic : application,
    'wrong session\'s creation' : {
      'without id' : function( app ){
        assert.throws( function() {
          new Session({
            app : app
          });
        } );
      }
    },
    'public properties and methods' : {
      topic : function( app ) {
        return new Session({
          id  : 2,
          app : app
        });
      },
      'session.id = 2' : function( session ){
        assert.equal( session.id, 2 );
      },
      'static method `get_by_id`' : {
        'must return session by its id' : function( session ){
          assert.equal( Session.get_by_id( session.id ), session );
        },
        'must return null if no session with passed id' : function( session ){
          assert.isNull( Session.get_by_id( 5 ) );
        }
      }
    }
  }
}