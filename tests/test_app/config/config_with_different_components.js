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
    },

    // user's components
    user_component : {
      param : 42
    },

    nested_user_component : {
      param : 43
    },

    hidden_component : {
      param : 44
    }
  }
}