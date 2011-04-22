exports.get_batch = function( application, assert ) {
  var Post            = require('post');
  var DbTableSchema   = require('db/db_table_schema');
  var CommandBuilder  = require('db/command_builder');

  return {
    'static model' : {
      topic : application.models.post,
      'link to db connection' : function( post ){
        assert.equal( post.db_connection, application.db );
      },
      'table name' : function( post ){
        assert.equal( post.table_name, 'posts' );
      },
      'table schema' : {
        topic : function( post ) {
          post.get_table( this.callback );
        },
        'instance test' : function( e, table ){
          assert.isNull(e);
          assert.instanceOf( table, DbTableSchema );
        },
        'primary key' : function( e, table ){
          assert.equal( table.primary_key, 'id' );
        },
        'in sequence' : function( e, table ){
          assert.isTrue( table.in_sequence );
        },
        'attributes' : {
          topic : function( table, post ){
            return post.get_attributes( table );
          },
          'test' : function( attrs ) {
            assert.deepEqual( attrs, {
              id          : null,
              title       : null,
              create_time : null,
              author_id   : null,
              content     : null
            } );
          }
        }
      },
      'command builder' : function( post ){
        assert.instanceOf( post.get_command_builder(), CommandBuilder );
      }
    },
    'created model' : {
      topic : new application.models.post,
      'instance test' : function( post ){
        assert.instanceOf( post, Post );
      },
      'id is null' : function( post ){
        assert.isNull( post.id );
      },
      'title is null' : function( post ){
        assert.isNull( post.title );
      },
      'after set safe attributes' : {
        topic : function( post ) {
          post.set_attributes({
            id : 3,
            title : 'test title'
          });

          return post;
        },
        'id should not be changed' : function( post ){
          assert.isNull( post.id );
        },
        'title should be `test title`' : function( post ){
          assert.equal( post.title, 'test title' );
        }
      }
    },

    'find' : {
      topic : application.models.post,
      'without params' : {
        topic : function( post ) {
          return post.find();
        },
        'should return first entire' : function( e, result ){
          assert.isNull( e );
          assert.equal( result.id, 1 );
        }
      }
    }
  }
}