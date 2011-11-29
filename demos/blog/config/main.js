var config = module.exports = {
  name                : 'drawing',
  base_dir            : __dirname + '/../',

  default_controller  : 'action',
  views_folder        : 'views/templates',
  cache_views         : false,

  router : {
    rules     : {
      ''          : 'site.index',
      'register'  : 'site.register',
      'login'     : 'site.login',
      'logout'    : 'site.logout'
    }
  },

  preload_components : [ 'log_router', 'db' ],

  components : {
    users : true,

    http                : {
      port            : 3000,
      root_folders    : {
        js       : 'views/js',
        css      : 'views/css'
      }
    },

    log_router          : {
      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }
      }
    },

    db : {
      type      : 'mysql',
      user      : 'test',
      password  : 'test',
      database  : 'autodafe_demo_blog',
      host      : 'localhost'
    }
  }
};