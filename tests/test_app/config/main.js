try {
  var db = require('./db').db;
}
catch ( e ) {
  throw new Error( 'Please copy file `' + __dirname + '/common_db.js` to `' + __dirname + '/db.js` and edit it for your current mysql connection' );
}

var config = module.exports = {
  base_dir    : __dirname + '/../',
  name        : 'TestApp',

  default_controller  : 'test',
  params              : {
    param1 : 'some param',
    param2 : 0,
    param3 : false,
    param4 : null
  },

  router : {

    rules     : {
      'single_route_rule' : 'test.test',
      'multi_route_rule'  : [
        'test.test',
        'another_test.test'
      ],
      'rule_with_unimplemented_test_action' : [
        'test.test',
        'test.not_existed_test_action',
        'another_test.test'
      ],
      'rule_with_undeclared_test_action' : [
        'test.test',
        'test.some_implemented_action',
        'another_test.test'
      ],
      'rule_with_not_existed_controller' : [
        'test.test',
        'bad_controller.test',
        'another_test.test'
      ]
    }
  },

  preload_components : [
    'log_router'//,
//    'files'
  ],

  components : {

    web_sockets         : {
      port : 3000
    },

    users               : {
      model : 'test_model',
      roles : {
        user      : 'user.id != null',
        moderator : 'user.status == "moderator"',
        admin     : function( user, app ) {
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

    db                  : db,
    http                : {
      port : 3000
    },

    log_router          : {

      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        },
//        file : {
//          levels : [ 'trace', 'info', 'warning', 'error' ]
//        },
//        mail : {
//          levels    : [ 'trace', 'info', 'warning', 'error' ],
//          to        : 'user@host.ru',
//          from      : 'Autodafe',
//          subject   : 'Autodafe messages',
//          frequency : '1 per 10 sec'
//        }
        test : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }
      }
    },

//    mail : {
//      smtp : {
//        user : 'user_name',
//        pass : 'password',
//        host : 'smtp.gmail.com',
//        port : 25,
//        ssl  : false,
//        tls  : true
//      }//,
////      default_message : {
////        to      : 'user@host.com',
////        from    : 'another_user@host.com',
////        subject : 'subject'
////      }
//    },

    tests : {
      paths : [      // base_dir + path
        '../unit/framework'
//        '../unit/framework/base',
//        '../unit/framework/db/ar'
//        '../unit/framework/base/app_module_tests'
      ],
      exclude : [    // may be regexp or string which will be searched in path
        'web_socket'
      ]
    }
  }
};