var a = {
 fail: [Function]
, ok: [Function]
, equal: [Function]
, notEqual: [Function]
, deepEqual: [Function]
, notDeepEqual: [Function]
, strictEqual: [Function]
, notStrictEqual: [Function]
, throws: [Function]
, doesNotThrow: [Function]
, ifError: [Function]
};


var assert  = require('assert');
var path    = require('path');
var http    = require('http');

var config    = require( './test_app/config/main' );
var autodafe  = require( '../framework/autodafe' );
var DBConnection  = require( '../framework/db/db_connection' );
var WebSocketsApplication  = require( '../framework/web_sockets/web_sockets_application' );
var Controller  = require( '../framework/base/controller' );
var ActionController  = require( './test_app/controllers/action' );

var app = autodafe.create_application( config );
app.run();

assert.equal( app.name, 'TestApp' );
assert.equal( app.params[ 'test_param' ], 42 );
assert.equal( path.normalize( app.get_base_dir() ), __dirname + '/test_app/' );

var server = app.get_server();
assert.ok( server );

assert.ok( app instanceof WebSocketsApplication );

var controller = app.get_controller( 'action' );
assert.ok( controller instanceof ActionController );





//assert.ok( app.db instanceof DBConnection );