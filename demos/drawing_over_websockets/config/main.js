var config = module.exports = {
  name                : 'drawing',
  base_dir            : __dirname + '/../',

  default_controller  : 'action',
  views_folder        : 'views/templates',
  cache_views         : false,

  router : {
    rules     : {
      ''      : 'action.index',
      'line'  : 'action.line'
    }
  },

  preload_components : [ 'log_router' ],

  components : {
    web_sockets : {
      port : 8080
    },

    http                : {
      port            : 3000,
      root_folders    : {
        js       : 'views/js'
      }
    },

    log_router          : {
      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }
      }
    }
  }
};