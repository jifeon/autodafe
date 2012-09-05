var vows        = require( 'autodafe/node_modules/vows' );
var path        = require( 'path' );
var assert      = require( 'assert' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

function check_query( action ){
  return function( app ){
    var connection = app.create_connection();
    var client     = connection.create_client();
    var request    = client.create_request({
      action : action
    });

    client.on( 'send', this.callback.bind( null, null ) );
    client.on( 'send_error', this.callback );

    client.receive( request );
  }
}

vows.describe( 'controller' ).addBatch({

  'Application' : {
    topic : function(){
      return tests_tools.create_normal_application( this.callback );
    },

    '.test_controller' : {

      topic : function( app ) {
        return app.router.get_controller('test');
      },

      'should be instance of TestController' : function( controller ) {
        var TestController = require('autodafe/tests/applications/normal_app/controllers/test');
        assert.instanceOf( controller, TestController );
      },

      '.name of controller should be' : {

        'equal "test"' : function( controller ) {
          assert.equal( controller.name, 'test' );
        },

        'read only' : function( controller ){
          assert.isReadOnly( controller, 'name' );
        },

        'required' : function(){
          var app = this.context.topics[ 1 ];

          assert.throws( function() {
            new autodafe.Controller({
              app : app
            });
          } );
        }
      },

      '.default_action should be "index"' : function( controller ){
        assert.equal( controller.default_action, 'index' );
      },

      '.default_action should be fired by default' : function( controller ){
        var index_action_has_run = false;

        controller.once( 'action', function( action ) {
          index_action_has_run = action == 'index';
        } );
        controller.run_action();

        assert.isTrue( index_action_has_run );
      },

      '.models should be Application.models' : function( controller ){
        assert.equal( controller.models, this.context.topics[1].models );
      },

      '.run_action which is not exist should throw Error' : function( controller ){
        assert.throws( function() {
          controller.run_action( 'not_existed_action' );
        }, Error );
      },

      'default arguments in action should be instances of response and request' : function( controller ){
        var args;

        controller.once( 'test', function( _args ){
          args = _args;
        });

        var connection = this.context.topics[1].create_connection();
        var client     = connection.create_client();
        var request    = client.create_request();
        controller.run_action('test', request);

        assert.instanceOf( args[0], global.autodafe.cc.Response );
        assert.instanceOf( args[1], global.autodafe.cc.Request );
      },

      '.before_action should stop action running if it returns false' : function( controller ){
        var test_action_has_run = false;

        controller.before_action = function(){
          return false;
        }

        controller.once( 'test', function() {
          test_action_has_run = true;
        } );

        controller.run_action( 'test' );
        assert.isFalse( test_action_has_run );

        controller.before_action = controller.constructor.prototype.before_action;

        controller.run_action( 'test' );
        assert.isTrue( test_action_has_run );
      },

      '.before_action should change arguments for action if it returns array' : function( controller ){
        var action_args;

        controller.once( 'test', function( args ) {
          action_args = args;
        } );

        controller.before_action = function(){
          return [ 1, 2 ];
        }

        controller.run_action( 'test' );

        assert.deepEqual( Array.prototype.slice.call( action_args, 0 ), [ 1, 2 ] );

        controller.before_action = controller.constructor.prototype.before_action;
      },

      '.render' : {
        topic : function( controller ){
          controller.render( 'test.json', { message : 'ok' }, this.callback );
        },

        'json' : function( err, data ) {
          assert.isNull( err );

          var a;
          assert.doesNotThrow( function() {
            eval( 'a = ' + data );
          } );
          assert.deepEqual( a, {
            test : 'ok'
          } );
        }
      },

      '.action' : {
        topic : function( controller, app ){
          var connection = app.create_connection();
          var client     = connection.create_client();
          var request    = client.create_request({
            action : 'redirect'
          });

          var emitter = new process.EventEmitter;
          controller.on( 'test', emitter.emit.bind( emitter, 'success' ) );

          client.receive( request );
          return emitter;
        },

        'should change response' : function( args ){
          var response = args[0];
          assert.equal( response.view_name(),       'test'            );
          assert.equal( response.view_file_name(),  'test.html'       );
          assert.equal( response.view_extension(),  '.html'           );
          assert.equal( response.view_path(), path.join( response.controller.views_path, 'test.html' ));
        }
      },

      'async tools' : {
        topic : function( controller ){
          return controller.create_response('redirect_action');
        },

        'normal work' : {
          topic : function( response ){
            var self  = this;
            var async = response.create_listener();

            var emitter  = new process.EventEmitter;
            var emitter2 = new process.EventEmitter;

            process.nextTick( function(){
              emitter.emit('success', 'emitter');
              process.nextTick( function(){
                emitter2.emit('success', 'emitter2');
              });
            });

            async.handle_emitter( emitter );
            async.stack <<= emitter2;

            (function( cb ){
              process.nextTick( cb.bind( null, null, 'callback' ) );
            })( async.get_callback() );

            async.success( function(){ self.callback( null, Array.prototype.slice.call(arguments, 0))});
          },

          'async.success' : function( args ){
            assert.deepEqual( args, ['emitter', 'emitter2', 'callback']);
          }
        },

        'error handling' : {
          'in emitter' : {
            topic : function( response, controller ){
              var self  = this;
              var async = response.create_listener();
              var emitter  = new process.EventEmitter;

              process.nextTick( function(){
                emitter.emit('error', new Error);
              });

              async.handle_emitter( emitter );

              response.handle_error = this.callback;
              async.success( function(){ self.callback( null )});
            },

            'should throw to handle_error' : function( e, res ){
              assert.isError( e );
            }
          },

          'unique in emitter' : {
            topic : function( r, controller ){
              var response  = controller.create_response('redirect_action');
              var self      = this;
              var async     = response.create_listener();
              var emitter   = new process.EventEmitter;

              process.nextTick( function(){
                emitter.emit('error', new Error);
              });

              async
                .handle_emitter( emitter )
                .success( function(){ self.callback( null )})
                .error( this.callback );

              response.handle_error = function(){ self.callback( null )};
            },

            'should throw' : function( e, res ){
              assert.isError( e );
            }
          }
        },

        'custom actions' : {
          topic : function( r, controller ){
            var response  = controller.create_response('redirect_action');
            var self  = this;
            var async = response.create_listener();
            var emitter  = new process.EventEmitter;

            process.nextTick( function(){
              emitter.emit('custom', 'action');
            });

            async.handle_emitter( emitter );

            response.handle_error = this.callback;
            async.success( this.callback );
            controller.behavior_for( 'custom', function( response, request, param ){
              self.callback( null, param );
            } );
          },

          'should throw to handle_error' : function( e, res ){
            assert.isNull( e );
            assert.equal( res, 'action' );
          },

          'unique in emitter' : {
            topic : function( res, r, controller ){
              var response  = controller.create_response('redirect_action');
              var self  = this;
              var async = response.create_listener();
              var emitter  = new process.EventEmitter;

              process.nextTick( function(){
                emitter.emit('custom', 'action');
              });

              async
                .handle_emitter( emitter )
                .success( this.callback )
                .error( this.callback );

              controller.behavior_for( 'custom', function( response, request, param ){
                self.callback( null );
              } );

              response.behavior_for( 'custom', function( param ){
                self.callback( null );
              } );

              async.behavior_for( 'custom', function( param ){
                self.callback( null, param );
              } );
            },

            'should throw to handle_error' : function( e, res ){
              assert.isNull( e );
              assert.equal( res, 'action' );
            }
          }
        }
      },

      '.connect_client' : function(){
        throw 'no test';
      },

      '.create_url' : function(){
        throw 'no test';
      },

      '.create_widget' : function(){
        throw 'no test';
      }
    },

    'default workflow' : {
      topic : check_query('test2'),

      'should work' : function( e, result ){
        assert.isNull( e );
        assert.equal( result, 'Test' );
      }
    },

    'pass params to view' : {
      topic : check_query('test_params'),

      'should work' : function( e, result ){
        assert.isNull( e );
        assert.equal( result, 'global - simple - 1:2:3' );
      }
    },

    'pass asynchronous params to view' : {
      topic : check_query('async_params'),

      'should work' : function( e, result ){
        assert.isNull( e );
        assert.equal( result, 'global - simple - 1:2:3' );
      }
    }

  }
}).export( module );