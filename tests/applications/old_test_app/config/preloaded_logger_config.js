var config = module.exports = {
  base_dir    : require('path').join( __dirname, '..' ),
  name        : 'Preloaded logger',

  default_controller  : 'test',

  preload_components : [
    'log_router'
  ],

  components : {

    log_router : true,
    tests      : true
  }
};