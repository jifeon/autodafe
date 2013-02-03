var _ = require('underscore');
var db_root_config = _.defaults({
  type    : 'mysql',
  database: 'autodafe_tests'
}, require('autodafe/tests/data/db_root_config'));

module.exports = {
  name    : 'ar_app',
  base_dir: __dirname,

  preload_components: [ 'log_router', 'db' ],

//  router : {
//    rules : {
//      'test' : 'test.test'
//    }
//  },

  components: {
    log_router: {

      routes: {
        console: {
          levels: [ 'trace', 'info', 'warning', 'error' ]
        }//,
//        test : {
//          levels : [ 'trace', 'info', 'warning', 'error' ]
//        }
      }
    },

    db: db_root_config
  }
};