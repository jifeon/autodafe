var config = module.exports = {
  base_dir    : __dirname + '/../',
  
//  default_controller  : 'task',
//
//  router : {
//    rules     : {
//      'test' : 'task/test'
//    }
//  },
//
  server : {
    port : 8080
  },

  db : {
    type      : 'mysql',
    user      : 'root',
    password  : 'LJUji9',
    database  : 'draw',
    host      : 'localhost',
    port      : 9090
  }
};