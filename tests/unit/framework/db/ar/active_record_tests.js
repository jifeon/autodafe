exports.add_tests_to = function(suite) {

  var assert = require('assert');
  var app = suite.application;
  var Post = require("post_model");

  var commands = {
    find: function (model, func, cond, attr, pk, sql) {
      var command_emitter = new process.EventEmitter;

//      model[ func ].apply( model, Array.prototype.slice.call( arguments, 2 ) ).on( 'complete', function() {
//        command_emitter.emit('success', res);
//      } );

      switch (func) {
        case 'find' :
          model.find(cond, attr).on('complete', function(res) {
            command_emitter.emit('success', res);
          });
          break;

        case 'find_all' :
          model.find_all(cond, attr).on('complete', function(res) {
            command_emitter.emit('success', res);
          });
          break;

        case 'find_by_pk' :
          model.find_by_pk(pk, cond, attr).on('complete', function(res) {
            command_emitter.emit('success', res);
          });
          break;
      }

      return command_emitter;
    }
  }

  suite.addBatch({
    'ActiveRecord test' : {
      topic : new app.model( Post ),
      'db test'        : function(topic) {
        assert.equal(topic.get_db_connection(), app.db);
      },
      'table test'      : function(topic) {
        assert.equal(topic.table, 'posts');
      },
      'set_attributes'  : function(topic) {
//        assert.isUndefined( topic.id );
//        topic.set_attributes( { 'id' : 3, 'title' : 'test title' } );
//        assert.isUndefined( topic.id );
//        assert.equal( topic.title, 'test title' );
      },
      'primary key'     : function(topic) {
        assert.equal(topic.primary_key(), 'id');
      },
      'table_schema'    : function(topic) {
      },
      'find command'  : {
        topic         : function( topic ){
          return commands.find( topic, 'find', '', {}, 0, '' )
        },
        'tests instance, id' : function( res ){
          assert.instanceOf(res, Post);
          assert.equal( res.id, 12 );
        }
      },
      'find with condition command'  : {
        topic         : function( topic ){
          return commands.find( topic, 'find', 'id=:id', { id : 5 }, 0, '' )
        },
        'tests "instance, id"'  : function( res ) {
          assert.instanceOf( res, Post );
          assert.equal( res.id, 15 );
          }
        },
      'find without result'  : {
        topic         : function( topic ) {
          return commands.find( topic, 'find', 'id=6', {}, 0, '' )
        },
        'tests no result'  : function( res ) {
          assert.isNull( res );
        }
      },
      'find_all command' : {
        topic         : function( topic ) {
          return commands.find( topic, 'find_all', '', {}, 0, '' )
        },
        'lenght,instance,id' : function( res ) {
          //console.log(res[0].id);
          assert.length( res, 5 );
          assert.instanceOf( res[3], Post );
          assert.equal( res[3].id, 4 );
        }
      },
      'find_all with condition ' : {
        topic         : function( topic ) {
          return commands.find( topic, 'find_all', { limit : 3, offset : 1 }, {}, 0, '' )
        },
        'lenght,instance,id' : function( res ) {
          assert.length( res, 3 );
          assert.instanceOf( res[2], Post );
          assert.equal( res[2].id, 4 );
        }
      },
      'find_all without result' : {
        topic         : function( topic ) {
          return commands.find( topic, 'find_all', 'id = 5', {}, 0, '')
        },
        'empty result?' : function( res ) {
          console.log(res);
//          assert.length( res, 0 );
        }
      }
    }
  });
}

//exports.add_tests_to = function( suite ){
//
//  suite.addBatch({
//    'test' : {
//      topic : suite.application.model( Post ),
//      'test' : {
//        topic : function( t ){
//          var command_emitter = new process.EventEmitter;
//          t.get_model().find_all().on( "complete", function( res ) {
//            command_emitter.emit('success', res);
//          });
//          return command_emitter;
//        },
//        'test result' : function( res ){
//          assert.equal(res[0].id, 2);
////          while (row = res.fetchArraySync()) {
////            console.log(res[0].id);
////          }
//        }
//      }
//    }
//  });
//}