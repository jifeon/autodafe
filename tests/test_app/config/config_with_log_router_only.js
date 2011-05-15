module.exports = {
  base_dir        : __dirname + '/../',
  name            : 'AppWithLogRouterOnly',

  preload_components : [ 'log_router' ],

  components      : {
    log_router          : {
      routes : {
        test : {
          levels : [ 'warning', 'error', 'info', 'trace' ]
        }
      }
    }
  }
}