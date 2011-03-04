var config    = require( './config/main' ),
    autodafe  = require( '../../framework/autodafe.js' );

var app = autodafe.create_application( config );
app.tests.run();