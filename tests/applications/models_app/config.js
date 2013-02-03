var _ = require('underscore');
var db_root_config = _.defaults({
  type    : 'mysql',
  database: 'autodafe_tests'
}, require('autodafe/tests/data/db_root_config'));


module.exports = {
  name              : 'models',
  base_dir          : __dirname,
  preload_components: ['log_router'],
  components        : {
    db        : db_root_config,
    log_router: {
      routes: {
        console: {
          levels: ['info', 'error', 'warning', 'trace']
        }
      }
    }
  }
};