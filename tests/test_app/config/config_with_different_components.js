module.exports = {
  base_dir        : __dirname + '/../',
  name            : 'CMApp',

  preload_components : [ 'log_router' ],

  components      : {
    web_sockets         : false,
    users               : true,

    log_router          : {
      routes : {
        console : {
          levels : [ 'warning', 'error', 'info', 'trace' ]
        }
      }
    },

    // user's components
    user_component : {
      param : 42
    },

    nested_user_component : {
      param : 43
    }
  }
}