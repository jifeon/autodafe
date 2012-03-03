var Autodafe  = require( 'autodafe' );

module.exports.normal_config = require('autodafe/tests/applications/normal_app/config/normal_config');

module.exports.create_normal_application = function( callback, options ){
  var app = Autodafe.get_application( 'normal_app' );
  if ( app ) {
    if ( app.is_running ) callback( null, app );
    else app
      .on( 'run', callback.bind( null, null, app ) )
      .on( 'error', callback );
    return;
  }

  Autodafe.create_application( this.normal_config ).run( callback );
}

var app_count = 0;
module.exports.get_new_app = function( app_config, options ) {
  options         = options    || {};
  var def_config  = {
    base_dir : this.normal_config.base_dir,
    name     : 'test_application_' + app_count++
  };

  app_config = options.merge_config ? Object.merge( def_config, app_config ) : app_config || def_config;

  var app = Autodafe.create_application( app_config, options.create_callback );

  if ( options.run ) app.run( options.run_callback );

  return app;
}