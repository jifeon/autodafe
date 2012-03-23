var db_root_config = Object.merge( require( 'autodafe/tests/data/db_root_config' ), {
  type     : 'mysql',
  database : 'autodafe_tests'
} );

module.exports = {
  name      : 'normal_app',
  base_dir  : require('path').join( __dirname, '..' ),

  preload_components : [ 'log_router', 'db' ],
  default_controller : 'test',

  params              : {
    param1 : 'some param',
    param2 : 0,
    param3 : false,
    param4 : null
  },

  router : {
    rules : {
      'test'                   : 'test.test',
      'test_client_connection' : 'test.test_client_connection'
    }
  },

  components : {
    log_router          : {

      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        },
        test : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }
      }
    },

    http : {
      port : 3002,
      root_folders : {
        config : 'config'
      },
      upload_dir : 'upload'
    },

    web_sockets : {
      port : 8080
    },

    db : db_root_config
  }
}