var Autodafe  = require('autodafe');
var assert    = require('assert');
var path      = require('path');

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


module.exports.create_db_app = function( callback ){
  if ( db_app ) return callback( null, db_app );

  var db_root_config  = require( 'autodafe/tests/data/db_root_config' );
  db_root_config.type = 'mysql';

  try{
    schema_commands = require('fs')
      .readFileSync( path.resolve( __dirname, '../data/table_schemas.sql' ), 'utf8' )
      .split(';').filter( function( str ){
        return str.trim();
      } );
  }catch(e){
    return callback(e);
  }

  db_app = module.exports.get_new_app( {
//    base_dir : path.join( __dirname, '../applications/db_app' ),
    preload_components : ['log_router', 'db'],
    components : {
      log_router : { routes : { console : { levels : [ 'error', 'warning', 'info', 'trace' ] } } },
      db         : db_root_config
    }
  }, {
    merge_config    : true,
    create_callback : callback
  } )
}


var db_app, schema_commands;
module.exports.prepare_base = function(){
  return {
    'Prepare schemas' : {
      topic : function(){
        module.exports.create_db_app( this.callback );
      },

      'exec sql file' : {
        topic : function( app ){

          var listener = app.tools.create_async_listener( schema_commands.length, this.callback, null, {
            error_in_callback : true
          } );

          app.log_router.get_route( 'console' ).switch_level_off( 'trace' );
          schema_commands.forEach( function( command ){
            app.db.query( command, listener.listen( 'error' ) );
          } );
        },

        'check' : function( e, res ){
          assert.isNull(e);
        }
      }
    }
  }
}


function load_fixture( name, app, callback ){
  try{
    var fixture = require( 'autodafe/tests/data/fixtures/' + name + '.js' ).slice(0);
  } catch(e){
    return callback(e);
  }

  var columns  = fixture.shift();
  var listener = app.tools.create_async_listener( fixture.length, callback, null, {
    error_in_callback : true
  } );

  fixture.forEach( function( values ){
    var sql = "INSERT INTO table (fields) VALUES (values)".format({
      table   : name,
      fields  : columns.join(', '),
      values  : values.map( app.db.quote_value.bind( app.db ) ).join(', ')
    });
    app.db.query( sql, listener.listen('error') );
  } )
}


module.exports.prepare_tables = function(){
  var tables = Array.prototype.slice.call( arguments, 0 );

  return {
    'Prepare tables' : {
      topic : function(){
        module.exports.create_db_app( this.callback );
      },

      'exec fixtures' : {
        topic : function( app ){

          var listener = app.tools.create_async_listener( tables.length/**2*/, this.callback, null, {
            error_in_callback : true
          } );

//          tables.forEach( function( table ){
//            app.db.query( 'delete from ' + table, listener.listen('error') );
//          } );

          tables.forEach( function( table ){
            load_fixture( table, app, listener.listen( 'error' ) );
          } );
        },

        'check' : function( e, res ){
          assert.isNull(e);
        }
      }
    }
  }
}


var ar_config       = require( 'autodafe/tests/applications/ar_app/config' );
var ar_app;
module.exports.get_ar_app = function( callback ){
  if ( ar_app ) {
    if ( ar_app.is_running ) callback( null, ar_app );
    else ar_app.on( 'run', callback.bind( null, null, ar_app ) );
    return;
  }

  ar_app = this.get_new_app( ar_config, {
    run_callback : callback,
    run          : true
  } );
}