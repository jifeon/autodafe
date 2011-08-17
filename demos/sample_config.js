  var config = module.exports = {
    base_dir        : __dirname + '/../',
    name            : 'Application name',

    default_controller  : 'site',

    router : {

      rules     : {
        'abbreviation' : 'controller_name.action_name'
      }
    },

    preload_components : [ 'log_router', 'db' ],

    components : {

      web_sockets_server  : true,
      user                : true,

      db                  : {
        type : 'mysql',
        user : 'root',
        pass : '',
        base : 'test',
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
      }
    }
  };