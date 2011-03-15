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

//    files : {
//      default_folder : 'templates'
//    },

    tests : {
      directory : false,
      files : [
        'unit/framework/base/application_tests',
        'unit/framework/base/controller_tests',
        'unit/framework/base/model_tests',
        'unit/framework/base/router_tests',
        'unit/framework/base/session_tests',
        'unit/framework/base/components/component_tests',
        'unit/framework/base/components/components_manager_tests',
        'unit/framework/db/ar/active_record_tests'
      ]
    }
  }
};