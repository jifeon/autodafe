exports.get_batch = function( application, assert ) {

  var Post = require("post");
  var commands = {
    find: function (model, func, cond, attr, pk, sql) {
      var command_emitter = new process.EventEmitter;

      model[ func ].apply( model, Array.prototype.slice.call( arguments, 2 ) ).on( 'complete', function( res ) {
        command_emitter.emit('success', res);
      } );
      return command_emitter;
    }
  }

  return {
    topic : function() {
      return new application.models.post;
    },
    'db test'        : function( topic ) {
      assert.equal( topic.get_db_connection(), application.db );
    },
    'table name test'      : function( topic ) {
      assert.equal( topic.table, 'posts' );
    },
    'table schema' : {
      topic : function( topic ) {
        topic.get_table_schema( this.callback );
      },
      'get table' : function( table, err ){
        assert.isTrue( table._initialized );
      }
    },
    'set attributes'  : function( topic ) {
      assert.isUndefined( topic.id );
      topic.set_attributes( { 'id' : 3, 'title' : 'test title' } );
      assert.isUndefined( topic.id );
      assert.equal( topic.title, 'test title' );
    },
    'primary key'     : function( topic ) {
      assert.equal( topic.primary_key(), 'id' );
      topic.set_primary_key( 3 );
      assert.equal( topic.id, 3 );
    },
    'find command'  : {
      topic         : function( topic ){
        return commands.find( topic, 'find', '', {}, 0, '' )
      },
      'tests instance, id' : function( res ){
        assert.instanceOf(res, Post);
        assert.equal( res.id, 1 );
      }
    },
    'find with condition command'  : {
      topic         : function( topic ){
        return commands.find( topic, 'find', 'id=:id', { id : 5 }, 0, '' )
      },
      'tests "instance, id"'  : function( res ) {
        assert.instanceOf( res, Post );
        assert.equal( res.id, 5 );
        }
      },
    'find without result'  : {
      topic         : function( topic ) {
        return commands.find( topic, 'find', 'id=6', {}, 0, '' )
      },
      'tests no result'  : function( res ) {
        assert.isNull( res, 'should be equal null' );
      }
    },
    'find_all command' : {
      topic         : function( topic ) {
        return commands.find( topic, 'find_all', '', {}, 0, '' )
      },
      'lenght,instance,id' : function( res ) {
        //console.log(res[0].id);
        assert.length( res, 5, 'result should have 5 items' );
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
        return commands.find( topic, 'find_all', 'id = 6', {}, 0, '')
      },
      'empty result?' : function( res ) {
        assert.length( res, 0, 'result should be empty' );
      }
    }//,
//    'insert test' : {
//      topic : new application.model( Post ),
//      'attributes test' : function( topic ){
//        var tmp ={
//          id          : null,
//          title       : null,
//          create_time : null,
//          author_id   : null,
//          content     : null
//        };
//        assert.equal( topic.get_attributes(), tmp );
//      },
//      'insert command' : {
//        topic : function( topic ){
//          topic.id          = 6;
//          topic.title       = 'test post 1';
//          topic.create_time = '2000-01-06 00:00:00';
//          topic.author_id   = 1;
//          topic.content     = 'test post content 1';
//          topic.set_is_new_record( true );
//
//          var emitter = new process.EventEmitter;
//          topic.save().on( 'complete', function(res){
//            emitter.emit('success', res);
//          });
//          return emitter;
//        },
//        'must return id = 6'  : function( res ){
//          assert.equal( res.insertId, 6 );
//        }
//      }
//    }
  }
}
