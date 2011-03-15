var config = module.exports = {
  base_dir        : __dirname + '/../',
  name            : 'AppName',

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

    web_sockets_server  : true,
    user                : true,

    db                  : {
      type : 'mysql',
      user : 'username',
      pass : 'password',
      base : 'db_name',
      host : 'localhost',
      dbslayer : {
        host : 'localhost',
        port : 9090
      }
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
    }
  }
};