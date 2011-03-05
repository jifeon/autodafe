exports.add_tests_to = function( suite ) {

  var assert = require('assert');

  var ActiveRecord = require('db/ar/active_record');

  var Post = module.exports = function(params) {
    ActiveRecord.prototype._init.call(this, params);
  };


  Post.get_table_name = function () {
    return 'posts';
  };

  Post.model = function() {
    return ActiveRecord.model(this);
  };

  require('sys').inherits(Post, ActiveRecord);

  var commands = {
    find: function ( model, func, cond, attr, pk, sql) {
      var command_emitter = new process.EventEmitter;

      switch( func ) {
        case 'find' :
          model.find( cond, attr ).on( 'complete', function( res ) {
            command_emitter.emit( 'success', res );
          } );
        break;

        case 'find_all' :
          model.find_all( cond, attr ).on( 'complete', function( res ) {
            command_emitter.emit( 'success', res );
          } );
        break;

        case 'find_by_pk' :
          model.find_by_pk( pk, cond, attr ).on( 'complete', function( res ) {
            command_emitter.emit( 'success', res );
          } );
        break;
      }

      return command_emitter;
    }
  }

  suite.addBatch({
    'ActiveRecord test' : {
      topic : new ( Post ),
      'db test'         : function( topic ){
        assert.equal( topic.get_db_connection(), app.db );
      },
      'table test'      : function( topic ){
        assert.equal( topic.table, 'posts' );
      },
      'set_attributes'  : function( topic ){
        assert.isUndefined( topic.id );
        topic.set_attributes( { 'id' : 3, 'title' : 'test title' } );
        assert.isUndefined( topic.id );
        assert.equal( topic.title, 'test title' );
      },
      'primary key'     : function(topic) {
        assert.equal(topic.primary_key(), 'id');
      },
      'table_schema'    : function( topic ){
//        var ts = require('db/db_table_schema');
//        assert.equal( topic.get_table_schema(), ts );
      },
      'model test'      : {
        topic : function( topic ){
          return topic.get_model();
        },
        'instance test'   : function( model ) {
          assert.instanceOf( model, Post );
        },
        'functions tests' : {
          'find command'  : {
            topic         : function( model ){ return commands.find( model, 'find', '', {}, 0, '' ) },
          'tests "id"'    : function( res ) {
            assert.instanceOf( res, Post );
            assert.equal(res.id, 1);
          }
        },
          'find with condition command'  : {
            topic         : function( model ){ return commands.find( model, 'find', 'id=:id', { id : 5 }, 0, '' ) },
            'tests "id"'  : function( res ) {
              assert.instanceOf( res, Post );
              assert.equal( res.id, 5 );
            }
          },
          'find without result'  : {
            topic         : function( model ){ return commands.find( model, 'find', 'id=6', {}, 0, '' ) },
            'tests "id"'  : function( res ) {
              assert.isNull( res );
            }
          },
          'find_all command' : {
            topic         : function( model ){ return commands.find( model, 'find_all', '', {}, 0, '' ) },
            'lenght,instance,id' : function( res ){
              assert.length( res, 5 );
              assert.instanceOf( res[3], Post );
              assert.equal( res[3].id, 4 );
            }
          },
          'find_all with condition ' : {
            topic         : function( model ){
              return commands.find( model, 'find_all', { limit : 3, offset : 1 }, {}, 0, '')
            },
            'lenght,instance,id' : function( res ){
              assert.length( res, 3 );
              assert.instanceOf( res[2], Post );
              assert.equal( res[2].id, 4 );
            }
          },
          'find_all without result' : {
            topic         : function( model ){
              return commands.find( model, 'find_all', 'id = 6', {}, 0, '' )
            },
            'empty result?' : function( res ){
              assert.length( res, 0 );
            }
          },
          'find_by_pk' : {
            topic         : function( model ){
              return commands.find( model, 'find__by_pk', '', {}, 2, '' )
            },
            'test "id"' : function( res ){
              assert.equal( res.id, 2 );
            }
          },
          'jst test' : {
            topic : 42,
            'is it the UQoLtU&E' : function(topic){ assert.equal(topic, 42 );}
          }
        }
      }
    }
  });
 // var t = new Post();
 // console.log(t.get_meta_data());
  //t.get_model().find_by_pk(2,'',{});
}
