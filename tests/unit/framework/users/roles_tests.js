exports.get_batch = function( application, assert ) {
  var Model         = global.autodafe.Model;
  var UserIdentity  = require( 'autodafe/framework/users/user_identity' );

  var ui_roles = [];

  for ( var i = 0; i < 4; i++ ) {
    var user = new application.models.ui_user({
      role : 'role' + i
    });

    var ui = new UserIdentity({
      app           : application,
      users_manager : application.users
    });
    ui.set_model( user );

    ui_roles.push( ui );
  }

  return {
    topic : function() {
      return new application.models.ui_test;
    },
    'proxy type' : function( ui_test ){
      ui_test = ui_roles[0].manage( ui_test );
      assert.instanceOf( ui_test, Model );
    },
    'guest' : function( ui_test ){
      var handled_ui_test = application.users.guests.manage( ui_test );
      assert.equal( handled_ui_test.p1, 1 );
      assert.equal( handled_ui_test.p2, 2 );

      handled_ui_test.set_attribute( 'p1', 42 );
      assert.equal( ui_test.p1, 1 );

      handled_ui_test.p1 = 42;
      assert.equal( ui_test.p1, 1 );

      handled_ui_test.p2 = 100500;
      assert.equal( ui_test.p2, 2 );

      handled_ui_test.set_attributes({
        p1 : 42,
        p2 : 100500
      });

      assert.equal( ui_test.p1, 1 );
      assert.equal( ui_test.p2, 2 );

      assert.deepEqual( handled_ui_test.get_attributes(), {
        p1 : 1,
        p2 : 2
      } );
      assert.isError( handled_ui_test.save(), 'Failed save' );
      assert.isError( handled_ui_test.remove(), 'Failed remove' );
    },
    'role 0' : function( ui_test ){
      var handled_ui_test = ui_roles[0].manage( ui_test );
      assert.equal( handled_ui_test.p1, 1 );
      assert.equal( handled_ui_test.p2, 2 );

      handled_ui_test.p1 = 42;
      assert.equal( ui_test.p1, 42 );
      ui_test.p1 = 1;

      handled_ui_test.p2 = 100500;
      assert.equal( ui_test.p2, 100500 );
      ui_test.p2 = 2;

      handled_ui_test.set_attributes({
        p1 : 42,
        p2 : 100500
      });

      assert.equal( ui_test.p1, 42 );
      assert.equal( ui_test.p2, 100500 );

      ui_test.p1 = 1;
      ui_test.p2 = 2;

      assert.deepEqual( handled_ui_test.get_attributes(), {
        p1 : 1,
        p2 : 2
      } );
      assert.isError( handled_ui_test.save() );
      assert.isError( handled_ui_test.remove() );
    },
    'role 1' : function( ui_test ){
      var handled_ui_test = ui_roles[1].manage( ui_test );
      assert.isNull( handled_ui_test.p1 );
      assert.isNull( handled_ui_test.p2 );

      handled_ui_test.p1 = 42;
      assert.equal( ui_test.p1, 42 );
      ui_test.p1 = 1;

      handled_ui_test.p2 = 100500;
      assert.equal( ui_test.p2, 2 );

      handled_ui_test.set_attributes({
        p1 : 42,
        p2 : 100500
      });

      assert.equal( ui_test.p1, 42 );
      assert.equal( ui_test.p2, 2 );

      ui_test.p1 = 1;

      assert.deepEqual( handled_ui_test.get_attributes(), {
        p1 : null,
        p2 : null
      } );
      assert.isTrue( handled_ui_test.save() );
      assert.isError( handled_ui_test.remove() );
    },
    'role 2' : function( ui_test ){
      var handled_ui_test = ui_roles[2].manage( ui_test );
      assert.equal( handled_ui_test.p1, 1 );
      assert.isNull( handled_ui_test.p2 );

      handled_ui_test.p1 = 42;
      assert.equal( ui_test.p1, 1 );

      handled_ui_test.p2 = 100500;
      assert.equal( ui_test.p2, 100500 );
      ui_test.p2 = 2;

      handled_ui_test.set_attributes({
        p1 : 42,
        p2 : 100500
      });

      assert.equal( ui_test.p1, 1 );
      assert.equal( ui_test.p2, 100500 );

      ui_test.p2 = 2;

      assert.deepEqual( handled_ui_test.get_attributes(), {
        p1 : 1,
        p2 : null
      } );
      assert.isError( handled_ui_test.save() );
      assert.isError( handled_ui_test.remove() );
    },
    'role 3' : function( ui_test ){
      var handled_ui_test = ui_roles[3].manage( ui_test );
      assert.isNull( handled_ui_test.p1 );
      assert.isNull( handled_ui_test.p2 );

      handled_ui_test.p1 = 42;
      assert.equal( ui_test.p1, 1 );

      handled_ui_test.p2 = 100500;
      assert.equal( ui_test.p2, 2 );

      handled_ui_test.set_attributes({
        p1 : 42,
        p2 : 100500
      });

      assert.equal( ui_test.p1, 1 );
      assert.equal( ui_test.p2, 2 );

      assert.deepEqual( handled_ui_test.get_attributes(), {
        p1 : null,
        p2 : null
      } );
      assert.isError( handled_ui_test.save() );
      assert.isTrue( handled_ui_test.remove() );
    }
  }
}