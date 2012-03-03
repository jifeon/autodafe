var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var path        = require( 'path' );
var http        = require( 'http' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );
var HTTPClient  = require( 'autodafe/framework/client_connections/http/http_client' );

function http_get( opts ){
  return function( app ){
    var self = this;

    var options = Object.merge({
      host: 'localhost',
      port: 3001,
      path: '/test'
    }, opts );

    http.get( options, function( res ){
      self.callback( null, res.statusCode );
    } ).on('error', function( e ) {
      self.callback( e );
    });
  }
}

vows.describe( 'http server' ).addBatch({
  'In normal application' : {
    topic : function(){
      tests_tools.create_normal_application( this.callback );
    },

    'HTTPServer' : {
      topic : function( app ){
        return app.http;
      },

      'should be run on 3000 port' : function( http_server ){
        assert.equal( http_server.port, 3002 );
      },

      '.upload_dir should be `upload`' : function( http_server ){
        assert.equal( http_server.upload_dir, path.join( tests_tools.normal_config.base_dir, 'upload' ) );
      },

      '.get_root_folder()' : function( http_server ){
        assert.equal( http_server.get_root_folder( 'config' ), 'config' );
      },

      'should create HTTPClient' : {
        topic : function( http_server ){
          var self = this;

          http_server.on( 'connect_client', function( client ){
            self.callback( null, client );
          } );

          var options = {
            host: 'localhost',
            port: 3002,
            path: '/test'
          };

          http.get( options ).on('error', function( e ) {
            self.callback( e );
          });
        },
        'on request' : function( e, client ){
          assert.isNull( e );
          assert.instanceOf( client, HTTPClient );
        }
      }
    }
  },


  
  'HTTP application with basic authentication' : {
    topic : function(){
      tests_tools.get_new_app( {
        router : {
          rules : { 'test' : 'test.test_http' }
        },
        preload_components : [ 'log_router' ],
        components : {
          log_router : { routes : { console : { levels : [ 'error', 'warning', 'info', 'trace' ] } } },
          http : {
            port : 3001,
            basic_auth : {
              users : {
                user : 'pass'
              }
            }
          }
        }
      }, {
        merge_config : true,
        run          : true,
        run_callback : this.callback
      } );
    },

    'should response 401 error' : {
      topic : http_get(),

      'when we get page without auth' : function( e, status ){
        assert.isNull( e );
        assert.equal( status, 401 );
      }
    },

    'should work' : {
      topic : http_get({ auth : 'user:pass' }),
      'with auth params' : function( e, status ){
        assert.isNull( e );
        assert.equal( status, 200 );
      }
    }
  }
}).export( module );