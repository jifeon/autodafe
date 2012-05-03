var db_root_config = Object.merge( require( 'autodafe/tests/data/db_root_config' ), {
  type     : 'mysql',
  database : 'autodafe_tests'
} );


module.exports = {
  name      : 'models',
  base_dir  : __dirname,
  preload_components: ['log_router'],
  components : {
    db        : db_root_config,
    log_router : {
      routes : {
        console : {
          levels : ['info', 'error', 'warning', 'trace']
        }
      }
    }
  }
}