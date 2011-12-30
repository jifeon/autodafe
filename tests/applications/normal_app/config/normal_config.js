module.exports = {
  name      : 'normal_app',
  base_dir  : require('path').join( __dirname, '..' ),

  preload_components : [ 'log_router' ],
  default_controller : 'test',

  params              : {
    param1 : 'some param',
    param2 : 0,
    param3 : false,
    param4 : null
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
    }
  }
}