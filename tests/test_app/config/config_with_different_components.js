module.exports = {
  base_dir        : __dirname + '/../',
  name            : 'CMApp',

  preload_components : [ 'log_router' ],

  components      : {
    web_sockets_server  : false,
    user                : true,
    log_router          : {
      routes : {
        console : {
          levels : [ 'warning', 'error' ]
        }
      }
    }
  }
}