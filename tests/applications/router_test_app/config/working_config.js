module.exports = {
  name      : 'app_with_controllers',
  base_dir  : require('path').join( __dirname, '..' ),

  router : {
    rules : {
      'domain.com /'         : 'good.domain_index',
      'hostname:domain.com port:3000 /action/<number:\\d+>/<text:\\w+>' : 'good.domain_action',

      ''                     : 'good.index',
      'action'               : 'good.action',
      'action/<number:\\d+>' : 'good.action',
      'action/<text:\\w+>'   : 'good.action',
      'action/<number:\\d+>/<some_param:\\d+>' : 'good.action',
      'do/<req_param:\\w+>'  : 'good.action',
      'remove'               : 'good.remove | post, delete',
      'bad_action'           : 'no_controller.action',
      'bad_action_in_good'   : 'good.bad_action'
    }
  },

  preload_components   : [ 'log_router' ],
  components: {
    log_router : {
      routes : {
        console : {
          levels : [ 'trace', 'error', 'warning', 'info' ]
        }
      }
    }
  }
}