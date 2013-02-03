var _ = require('underscore');
var db_root_config = _.defaults({
  type    : 'mysql',
  database: 'autodafe_tests'
}, require('autodafe/tests/data/db_root_config'));

module.exports = {
  name    : 'normal_app',
  base_dir: require('path').join(__dirname, '..'),

  preload_components: [ 'log_router', 'db' ],
  default_controller: 'test',

  params: {
    param1: 'some param',
    param2: 0,
    param3: false,
    param4: null
  },

  router: {
    rules: {
      'test'                  : 'test.test',
      'test_client_connection': 'test.test_client_connection',
      'redirect'              : 'test.redirect_action',
      'test2'                 : 'test2.index',
      'test_params'           : 'test2.test_params',
      'async_params'          : 'test2.async_params'
    }
  },

  components: {
    log_router: {

      routes: {
        console: {
          levels: [ 'trace', 'info', 'warning', 'error' ]
        },
        test   : {
          levels: [ 'trace', 'info', 'warning', 'error' ]
        }
      }
    },

    http: {
      port        : 3002,
      root_folders: {
        config: 'config'
      },
      upload_dir  : 'upload'
    },

    web_sockets: {
      port: 8080
    },

    db: db_root_config
  }
};