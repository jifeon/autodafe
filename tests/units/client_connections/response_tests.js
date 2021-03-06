var vows        = require( 'autodafe/node_modules/vows' );
var assert      = require( 'assert' );
var path        = require( 'path' );
var tests_tools = require( 'autodafe/tests/tools/tests_tools' );

vows.describe( 'controller' ).addBatch({

  'Application' : {
    topic : function(){
      return tests_tools.create_normal_application( this.callback );
    },

    '.test_controller' : {

      topic : function( app ) {
        return app.router.get_controller('test2');
      },

      'Response' : {
        topic : function( controller ){
          return controller.create_response( 'index' );
        },

        'check controller' : function( response ){
          assert.equal( response.controller, this.context.topics[1] );
        },

        'views' : function( response ){
          var app = this.context.topics[2];

          assert.equal( response.view_name(),       'index'       );
          assert.equal( response.view_file_name(),  'index.html'  );
          assert.equal( response.view_extension(),  '.html'       );
          assert.equal( response.view_path(), path.join( app.base_dir, 'views/controllers_test/index.html'));

          response.view_name('index2');

          assert.equal( response.view_name(),       'index2'       );
          assert.equal( response.view_file_name(),  'index2.html'  );
          assert.equal( response.view_extension(),  '.html'        );
          assert.equal( response.view_path(), path.join( app.base_dir, 'views/controllers_test/index2.html'));

          response.view_file_name('index.json');

          assert.equal( response.view_name(),       'index'       );
          assert.equal( response.view_file_name(),  'index.json'  );
          assert.equal( response.view_extension(),  '.json'       );
          assert.equal( response.view_path(), path.join( app.base_dir, 'views/controllers_test/index.json'));

          response.view_extension('html');

          assert.equal( response.view_name(),       'index'       );
          assert.equal( response.view_file_name(),  'index.html'  );
          assert.equal( response.view_extension(),  '.html'       );
          assert.equal( response.view_path(), path.join( app.base_dir, 'views/controllers_test/index.html'));

          response.view_path('test/index.html');

          assert.equal( response.view_name(),       'index'       );
          assert.equal( response.view_file_name(),  'index.html'  );
          assert.equal( response.view_extension(),  '.html'       );
          assert.equal( response.view_path(), path.join( app.base_dir, 'views/test/index.html'));

          response.view_path( path.join( app.base_dir, 'components/test/index.html'));

          assert.equal( response.view_name(),       'index'       );
          assert.equal( response.view_file_name(),  'index.html'  );
          assert.equal( response.view_extension(),  '.html'       );
          assert.equal( response.view_path(), path.join( app.base_dir, 'components/test/index.html'));
        }
      }
    }
  }
}).export( module );