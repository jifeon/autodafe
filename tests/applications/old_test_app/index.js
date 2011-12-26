var config    = require( 'config/main.js' ),
    autodafe  = require( 'autodafe/framework/autodafe.js' );

var app = autodafe.create_application( config );
app.run( function() {
  app.tests.run();
} );
