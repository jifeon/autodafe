var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

var Model     = autodafe.Model;

vows.describe( 'model' )
.addBatch( tests_tools.prepare_base() )
.addBatch({
  'get model application' : {
    topic : function(){
      var config = require( 'autodafe/tests/applications/models_app/config' );
      tests_tools.get_new_app( config, {
        create_callback : this.callback
      } );
    },

    'model1' : {
      topic : function( app ){
        return new app.models.model1;
      },

      '.get_attributes' : function( model ){
        assert.deepEqual( model.get_attributes(), {
          login     : null,
          email     : null,
          password  : null
        });

        assert.deepEqual( model.get_attributes_names(), ['login', 'email', 'password'] );
      },

      '.is_attribute' : function( model ){
        assert.ok( model.is_attribute( 'login' ) );
        assert.isFalse( model.is_attribute( 'not_attr' ) );
        model.set_attribute( 'not_attr', 5, false );
        assert.isFalse( model.is_attribute( 'not_attr' ) );
      },

      'using attributes' : function( model ){
        model.login = 'jifeon';
        assert.equal( model.login, 'jifeon' );
        assert.isNull( model.email );
        assert.isUndefined( model.something );
      },

      'params' : function( model ){
        assert.isUndefined( model.guest );
        var other_model = new this.context.topics[1].models.model1({guest : true});
        assert.isTrue( other_model.guest );
      },

      '.remove_attribute' : function( model ){
        model.remove_attribute( 'login' );
        assert.isFalse( model.is_attribute( 'login' ) );
        assert.isUndefined( model.login );
      },

      '.clean_attributes' : function( model ){
        model.email     = 'email';
        model.password  = 'password';

        model.clean_attributes( 'password' );
        assert.deepEqual( model.get_attributes(), {
          email     : 'email',
          password  : null
        });

        model.password  = 'password';
        model.clean_attributes();
        assert.deepEqual( model.get_attributes(), {
          email     : null,
          password  : null
        });
      }
    },

    'model2' : {
      topic : function( app ){
        return new app.models.model2;
      },

      'not attribute' : function( model ){
        assert.isUndefined( model.not_attr );
      },

      '.set_attributes' : function( model ){
        model.set_attributes({
          login     : 'jifeon',
          email     : 'jifeon@autodafe.ws',
          password  : 'qwerty'
        });

        assert.deepEqual( model.get_attributes(), {
          login     : 'jifeon',
          email     : 'jifeon@autodafe.ws',
          password  : null
        });

        assert.ok( model.is_safe_attribute( 'login' ) );
        assert.isFalse( model.is_safe_attribute( 'password' ) );
      }
    },

    'validation when' : {
      topic : function( app ){
        return new app.models.model3;
      },

      'all fields are wrong' : {
        topic : function( model ){
          model.validate( this.callback );
        },

        'should be 3 errors' : function(e, valid){
          assert.isNull( e );
          assert.isFalse( valid );

          var model = this.context.topics[1];
          assert.isTrue( model.has_errors() );

          var errors = model.get_errors();
          assert.deepEqual( Object.keys( errors ), ['login', 'password', 'email'] );

          for ( var field in errors ) {
            //все ошибки по поводу незаданности полей
            assert.include( errors[ field ], 'required' );
          }
        }
      }
    },

    'validation with emitter interface when' : {
      topic : function( app ){
        return new app.models.model3;
      },

      'all fields are wrong, but not empty' : {
        topic : function( model ){
          var callback = this.callback;
          model.set_attributes({
            login     : 'ab',
            password  : 'qwer',
            email     : 'wrong@format'
          }).validate()
            .on( 'error', function( e ){ callback( e ); } )
            .on( 'success', function(){ callback( new Error('Model is not valid') ); } )
            .on( 'not_valid', function( errors ){ callback( null, errors ); } )

        },

        'not_valid' : function( e, errors ){
          assert.isNull(e);
          assert.deepEqual( Object.keys( errors ), ['login', 'password', 'email'] );
          assert.include( errors['login'],    'between'   );
          assert.include( errors['email'],    'email'     );
          assert.include( errors['password'], 'at least'  );
        }
      }
    },

    'success validation' : {
      topic : function( app ){
        return new app.models.model3;
      },

      'of model3' : {
        topic : function( model ){
          model.set_attributes({
            login     : 'login',
            email     : 'login@host.com',
            password  : 'qwerty'
          }).validate( this.callback );
        },

        'should be 3 errors' : function(e, valid){
          assert.isNull( e );
          assert.isTrue( valid );

          var model = this.context.topics[1];
          assert.isFalse( model.has_errors() );
          assert.isEmpty( model.get_errors() );
        }
      }
    },

    'validation with alternative errors' : {
      topic : function( app ){
        return new app.models.model4;
      },

      'all fields should be with' : {
        topic : function( model ){
          model.set_attributes({
            password : 'qw',
            email    : '@not.email'
          }, true, true ).validate( this.callback );
        },

        'alternative errors' : function(e, valid){
          assert.isFalse( valid );

          var model   = this.context.topics[1];
          var errors  = model.get_errors();

          assert.equal( errors['username'], 'username required' );
          assert.equal( errors['email'],    'Please enter email instead of "@not.email"' );
          assert.equal( errors['password'], 'Field password should have 6 ch.' );
        }
      }
    },

    'saving' : {
      topic : function( app ){
        var callback  = this.callback;
        var model     = new app.models.model4;
        model.set_attributes({
          username : 'user',
          email    : 'user@host.com',
          password : 'password'
        }, true, true ).save()
          .on( 'error',     function( e )     { callback( e ); } )
          .on( 'success',   function()        { callback( null, model ); } )
          .on( 'not_valid', function( errors ){ callback( new Error('Model is valid') ); } );
      },

      'check' : function( e, model ){
        assert.isNull(e);
        assert.isFalse( model.has_errors() );
        assert.isEmpty( model.get_errors() );
      },

      'find_all' : {
        topic : function( app ){
          app.models.model4.find_all( this.callback );
        },

        'check results' : function( e, users ){
          assert.isNull(e);
          assert.isArray(users);
          assert.lengthOf( users, 1 );

          var user = users[0];
          assert.equal( user.username,  'user' );
          assert.equal( user.email,     'user@host.com' );
          assert.equal( user.password,  'password' );
        }
      }
    },

    'filtering' : function(app){
      var params = {
        username : ' user ',
        password : 'qwerty'
      }

      var model = new app.models.model5;
      model.set_attributes( params );
      assert.equal( model.username,         'user'  );
      assert.equal( model.password,         '8578edf8458ce06fbc5bb76a58c5ca4');
      assert.equal( model._.username.value, 'user'  );
      assert.equal( model._.password.value, 'qwerty');

      model.set_attributes( params, false );
      assert.equal( model.username,         ' user '  );
      assert.equal( model.password,         '8578edf8458ce06fbc5bb76a58c5ca4');
      assert.equal( model._.username.value, ' user '  );
      assert.equal( model._.password.value, 'qwerty');
    },

    'identification and comparing' : function( app ){
      var m1 = new app.models.model4;
      var m2 = new app.models.model4;
      assert.isFalse( m1.equals( m2 ) );

      var m3 = new app.models.model5;
      var m4 = new app.models.model5;
      assert.isTrue( m3.equals( m4 ) );

      var m5 = new app.models.model2;
      assert.isFalse( m4.equals( m5 ) );

      m3.email = 'qwe@ert.com';
      assert.isFalse( m3.equals( m4 ) );

      m4.email = 'qwe@ert.com';
      assert.isTrue( m3.equals( m4 ) );

      assert.equal( m3.get_id(), 'qwe@ert.com' );
      assert.isNull( m5.get_id() );

      var m6 = new app.models.model3;
      assert.deepEqual( m6.get_id(), {
        login : null,
        email : null
      } );

      var m7 = new app.models.model3;
      assert.isTrue( m6.equals( m7 ) );

      m6.set_attributes({
        email : 'asd@fgh.com',
        login : 'login'
      });

      m7.set_attributes({
        email : 'asd@fgh.com',
        login : 'login1'
      });
      assert.isFalse( m6.equals( m7 ) );

      m7.login = 'login';
      assert.isTrue( m6.equals( m7 ) );

      assert.ok( m6.is_key_attribute( 'login' ) );
      assert.isFalse( m6.is_key_attribute( 'password' ) );
    },

    //basic tests
    'model5' : {
      topic : function( app ){
        return new app.models.model5;
      },

      '.get_attribute() and .set_attribute()' : function( model ){
        model.set_attribute( 'username', 'login' );
        assert.equal( model.get_attribute('username'), 'login' );

        model.set_attribute( 'username', ' login ' );
        assert.equal( model.get_attribute('username'), 'login' );
        // фильтры уже применены, поэтому результат не отличается
        assert.equal( model.get_attribute('username', false), 'login' );

        // задаем без применения фильтров
        model.set_attribute( 'username', ' login ', false );
        assert.equal( model.get_attribute('username'), ' login ' );

        model.set_attribute( 'password', 'qwerty' );
        assert.equal( model.get_attribute('password'), '8578edf8458ce06fbc5bb76a58c5ca4' );
        assert.equal( model.get_attribute('password', false), 'qwerty' );
      }
    },

    'model' : {
      topic : function( app ){
        return new app.models.model2;
      },

      '.get_attributes() and .set_attributes()' : function( model ){
        model.set_attributes({
          login     : 'login',
          email     : 'email',
          password  : 'password'
        });

        assert.deepEqual( model.get_attributes(), {
          login     : 'login',
          email     : 'email',
          password  : null
        } );

        model.set_attributes({
          login    : 'login',
          email    : 'email',
          password : 'password'
        }, true, true );

        assert.deepEqual( model.get_attributes(), {
          login     : 'login',
          email     : 'email',
          password  : 'password'
        } );

        assert.deepEqual( model.get_attributes( [ 'login', 'email' ] ), {
          login : 'login',
          email : 'email'
        } );

        assert.deepEqual( model.get_attributes( 'login, email' ), {
          login : 'login',
          email : 'email'
        } );
      }
    },

    teardown : function( app ){
      app.stop();
    }
  }

}).export(module);