var config    = require( './config/main' ),
    autodafe  = require( 'autodafe/framework/autodafe.js' );

var app = autodafe.create_application( config );
app.run( function() {
  app.tests.run();
} );
