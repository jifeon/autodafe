var Autodafe  = require( 'autodafe' );

module.exports.normal_config = require('autodafe/tests/applications/normal_app/config/normal_config');

module.exports.create_normal_application = function( callback ){
  var app = Autodafe.get_application( 'normal_app' );
  if ( app ) return callback( null, app );

  Autodafe.create_application( this.normal_config, callback );
}

var app_count = 0;
module.exports.get_new_app = function( app_config, options ) {
  options    = options    || {};
  app_config = app_config ||  {
    base_dir : this.normal_config.base_dir,
    name     : 'test_application_' + app_count++
  };

  var app = Autodafe.create_application( app_config, options.create_callback );

  if ( options.run ) app.run( options.run_callback );

  return app;
}