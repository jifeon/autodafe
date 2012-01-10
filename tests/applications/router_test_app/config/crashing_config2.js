module.exports = {
  name      : 'app_with_bad_controllers',
  base_dir  : require('path').join( __dirname, '..' ),
  controllers_folder : 'bad_controllers',

  preload_components   : [ 'log_router' ],
  components: {
    log_router : {
      routes : {
        console : {
          levels : [ 'trace', 'error', 'warning', 'info' ]
        }
      }
    }
  }
}