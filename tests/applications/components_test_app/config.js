module.exports = {
  base_dir        : __dirname,
  name            : 'components_test_app',

  preload_components : [ 'log_router' ],

  components      : {
    web_sockets         : false,
    http                : true,

    log_router          : {
      routes : {
        console : {
          levels : [ 'warning', 'error', 'info', 'trace' ]
        }
      }
    },

    user_component : {
      param : 42
    },

    nested_user_component : {
      param : 43
    }
  }
}