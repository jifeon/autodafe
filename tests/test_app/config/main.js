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
//        }
      }
    },

    tests : {
      paths : [      // base_dir + path
        '../unit/framework/'
//        '../unit/framework/db/'
//        '../unit/framework/base/autodafe_part'
      ],
      exclude : [    // may be regexp or string which will be searched in path
//        'active_record_tests'//,
//        'db'
      ]
    }
  }
};