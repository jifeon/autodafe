var Autodafe  = require( 'autodafe' );

module.exports.normal_config = require('autodafe/tests/applications/normal_app/config/normal_config');

module.exports.create_normal_application = function( callback ){
  var app = Autodafe.get_application( 'normal_app' );
  if ( app ) return callback( null, app );

  Autodafe.create_application( this.normal_config, callback );
}