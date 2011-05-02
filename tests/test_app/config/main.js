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
        'test.unexist_test_action',
        'another_test.test'
      ],
      'rule_with_undeclared_test_action' : [
        'test.test',
        'test.some_implemented_action',
        'another_test.test'
      ],
      'rule_with_unexist_controller' : [
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

//    web_sockets_server  : true,
//    user                : true,
    db                  : require('./db').db,

    log_router          : {

      routes : {
        console : {
          levels : [ 'trace', 'info', 'warning', 'error' ]
        }//,
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
//        '../unit/framework/'
        '../unit/framework/base'
//        '../unit/framework/base/autodafe_part'
      ],
      exclude : [    // may be regexp or string which will be searched in path
        'active_record_tests.js'
      ]
    }
  }
};