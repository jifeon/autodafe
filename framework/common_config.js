var config = module.exports = {
  base_dir        : __dirname + '/../',
  name            : 'AppName',

  params          : {},

  default_controller  : 'app',

  router : {

    rules     : {
      'route_abbr'        : 'controller.action',
      'multi_route'       : [
        'controller1.some_action',
        'controller2.another_action'
      ]
    }
  },

  preload_components : [ 'log_router' ],

  components : {

    web_sockets         : {
      port : 8080
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
      possibilities : {
        guest     : [],
        user      : [],
        moderator : [ 'view' ],
        admin     : [ 'view', 'create', 'edit', 'remove' ]
      }
    },

    db                  : {
      type : 'mysql',
      user : 'username',
      pass : 'password',
      base : 'db_name',
      host : 'localhost'
    },

    log_router          : {
      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        },
        file : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }
      }
    },

    mail : {
      smtp : {
        user : 'username',
        pass : 'password'//,
//        host : 'localhost,    - for example smtp.gmail.com
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

    tests : {
      paths : [      // base_dir + path
        '../unit/framework/'
      ],
      exclude : [    // may be regexp or string which will be searched in path
        'active_record_tests.js'
      ]
    },

    user_component : {
      param : 42
    }
  }
};