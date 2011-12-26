try {
  var db = require('db.js').db;
}
catch ( e ) {
  throw new Error( 'Please copy file `' + __dirname + '/common_db.js` to `' + __dirname + '/db.js` and edit it for your current mysql connection' );
}

var config = module.exports = {
  base_dir    : require('path').join( __dirname, '..' ),
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
      'single_route_rule' : 'test.test'
    }
  },

  preload_components : [
    'log_router',
    'db'
  ],

  components : {

    web_sockets         : {
      port : 3000
    },

    users               : {
      model : 'user'//,
//      roles : {
//        role0     : 'user.role == "role0"',
//        role1     : 'user.role == "role1"',
//        role2     : 'user.role == "role2"',
//        role3     : function( user, app, model, attribute ) {
//          return user.role == 'role3';
//        }
//      },
//      rights : {
//        guest     : [],
//        role0     : [ 'view' ],
//        role1     : [ 'create' ],
//        role2     : [ 'edit' ],
//        role3     : [ 'remove' ]
//      }
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
        '../unit'
//        '../unit/framework'
//        '../unit/framework/db/ar/active_record_tests'
//        '../unit/framework/db/ar/ar_relations_tests'
//        '../unit/framework/db/mysql_tests'
      ],
      exclude : [    // may be regexp or string which will be searched in path
        'framework',
        'ar_relations',
        'web_socket',
        'router',
        'components_manager',
        'user_identity',
        'users_manager'
      ]
    }
  }
};