var config = module.exports = {
  base_dir    : __dirname + '/../',
  name            : 'TestApp',

//  default_controller  : 'site',

  router : {

    rules     : {
    }
  },

  preload_components : [
    'log_router',
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
      files : ['unit/framework/db/ar/active_record_tests']
    }
  }
};