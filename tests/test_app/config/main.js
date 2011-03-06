var config = module.exports = {
  base_dir    : __dirname + '/../',
  name        : 'TestApp',

  default_controller  : 'test',
  params              : {
    param1 : 'some param',
    param2 : 0,
    param3 : false,
    param4 : null
  },

  router : {

    rules     : {
    }
  },

  preload_components : [
    'log_router'//,
//    'files'
  ],

  components : {

//    web_sockets_server  : true,
//    user                : true,
    db                  : require('./db').db,

    log_router          : {

      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }//,
//        file : {
//          levels : [ 'trace', 'info', 'warning', 'error' ]
//        }
      }
    },

//    files : {
//      default_folder : 'templates'
//    },

    tests : {
      directory : false,
      files : [
        'unit/framework/base/application_tests',
        'unit/framework/base/controller_tests',
        'unit/framework/base/model_tests',
        'unit/framework/base/router_tests',
        'unit/framework/db/ar/active_record_tests'
      ]
    }
  }
};