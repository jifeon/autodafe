var config = module.exports = {
  name                : 'drawing',
  base_dir            : __dirname + '/../',

  default_controller  : 'site',
  views_folder        : 'views/templates',
  cache_views         : false,

  router : {
    rules     : {
      ''                      : 'site.index',
      'register'              : 'site.register        | post',
      'login'                 : 'site.login           | post',
      'logout'                : 'site.logout',

      'new_topic'             : 'site.create_topic',
      'topic/<topic_id:\\d+>' : 'site.view_topic',
      'comment'               : 'site.comment         | post'
    }
  },

  preload_components : [ 'log_router', 'db' ],

  components : {
    my_tools : true,

    users    : true,

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