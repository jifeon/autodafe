exports.get_batch = function( application, assert ) {
  var Logger = require( 'logging/logger' );

  return {
    topic : application.logger,
    'default params' : function( logger ){
      assert.equal( logger.default_module_name, 'Application' );
      assert.equal( logger.max_messages, 1024 );
      assert.equal( logger.splice_count, 100 );
      assert.equal( logger.latest_trace_count, 20 );
    },
    'messages should be a rad only array' : function( logger ){
      assert.isReadOnly( logger, 'messages' );
      assert.isArray( logger.messages );
    },
    'messages length should be not more than `max_messages`' : function( logger ){
      application.log_router.get_route( 'console' ).switch_level_off( 'trace' );

      for ( var i = 0, i_ln = logger.max_messages + 10; i < i_ln; i++ )
        logger.log( 'test message' );

      application.log_router.get_route( 'console' ).switch_level_on( 'trace' );
      
      assert.isTrue( logger.messages.length < logger.max_messages );
    },
    'latest trace' : function( logger ){
//      application.log_router.get_route( 'console' ).switch_level_off( 'trace' );
//
//      for ( var i = 0; i < i_ln; i++ )
//        logger.log( 'test message' );
//
//      application.log_router.get_route( 'console' ).switch_level_on( 'trace' );

    }
  }
}