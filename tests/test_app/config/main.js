var config = module.exports = {
  base_dir    : __dirname + '/../',
  
  name            : 'TestApp',
//  params          : {
//    test_param    : 42
//  },
//
//  application_type    : 'WebSockets',
//  default_controller  : 'action',
//
//  router : {
//    base_dir : __dirname + '/../',
//    rules     : {
//      'test' : 'task/test'
//    }
//  },
//
//  server : {
//    port : 8080
//  },
//
  components : {
  db : {
    type : 'mysql',
    user : 'root',
    pass : 'qwer',
    base : 'testbase',
    host : 'localhost',
    dbslayer : {
      host : 'localhost',
      port : 9090
    }
  },
  tests : {
    directory : false,
    files : ['unit/framework/db/ar/active_record_tests']
  }
  }
};