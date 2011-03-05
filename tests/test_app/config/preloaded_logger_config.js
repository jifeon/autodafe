var config = module.exports = {
  base_dir    : __dirname + '/../',
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