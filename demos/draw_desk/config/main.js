var config = module.exports = {
  base_dir    : __dirname + '/../',
  
  application_type    : 'WebSockets',
//  default_controller  : 'task',
//
//  router : {
//    base_dir : __dirname + '/../',
//    rules     : {
//      'test' : 'task/test'
//    }
//  },
//
  server : {
    port : 8080
  },

  db : {
    type : 'mysql',
    user : 'root',
    pass : 'LJUji9',
    base : 'draw',
    host : 'localhost',
    dbslayer : {
      host : 'localhost',
      port : 9090
    }
  }
};