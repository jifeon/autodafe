var config = module.exports = {
  base_dir        : require('path').join( __dirname, '..' ),
  name            : 'AppName',

  params          : {},

  default_controller  : 'app',
  views_folder        : 'views',
  models_folder       : 'models',
  controllers_folder  : 'controllers',
  components_folder   : 'components',
  session_live_time   : 60000, // время которое живет сессия без клиентов

  cache_views         : false,

  router : {

    rules     : {
      'route_abbr'        : 'controller.action',
      'post/<id:\\d+>'    : 'post.show'
    }
  },

  preload_components : [ 'log_router', 'db' ],

  components : {

    web_sockets         : {
      port : 8080
    },

    http : {
      port : 80,
      root_folders: {
        css : 'views/html/css'
      },
      upload_dir : 'tmp',
      basic_auth : {
        message : 'Private zone!! Please authorize',
        users   : {
          'john'    : 'password1',
          'silvia'  : 'glamurko123'
        }
      }
    },

    users               : {
      model : 'user',

      roles : {
        user      : 'user.id != null',
        moderator : 'user.status == "moderator"',
        admin     : function( user, app, target_model, target_attribute ) {
          return ~app.get_param( 'admin_ids' ).indexOf( user.id );
        }
      },
      // По умолчанию ниодна роль не имеет права ни на что.
      // Здесь указываются глобальные параметры ДЛЯ ВСЕГО, которые могут перезаданы для каждой отдельной модели,
      // которые в свою очередь могут быть перекрыты настройками для ее аттрибутов.
      rights : {
        guest     : [],
        user      : [],
        moderator : [ 'view' ],
        admin     : [ 'view', 'create', 'edit', 'remove' ]
      }
    },

    db                  : {
      type : 'mysql',
      user : 'username',
      password : 'password',
      database : 'db_name',
      host : 'localhost'
    },

    log_router          : {
      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        },
        file : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        },
        mail : {
          levels    : [ 'error' ],
          to        : 'your@email.com',
          subject   : 'AppName server errors',
          frequency : '1 per 1 min'
        }
      }
    },

    mail : {
      smtp : {
        user : 'username',
        pass : 'password'//,
//        host : 'localhost',    - for example smtp.gmail.com
//        port : 25,
//        ssl  : false,
//        tls  : true
      },
      default_message : {
//        to      : 'user@host.com',
//        from    : 'another_user@host.com',
//        subject : 'subject'
      }
    },

    user_component : {
      param : 42
    }
  }
};