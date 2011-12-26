module.exports = {
  name      : 'normal_app',
  base_dir  : require('path').join( __dirname, '..' ),

  preload_components : [ 'log_router' ],

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