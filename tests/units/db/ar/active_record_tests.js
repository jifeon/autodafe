var vows            = require( 'autodafe/node_modules/vows' );
var assert          = require( 'assert' );
var tests_tools     = require( 'autodafe/tests/tools/tests_tools' );

var Post            = require('autodafe/tests/applications/ar_app/models/post');
var DbTableSchema   = require('autodafe/framework/db/db_table_schema');
var DbCriteria      = global.autodafe.db.Criteria;
var CommandBuilder  = require('autodafe/framework/db/command_builder');

var ar_config       = require( 'autodafe/tests/applications/ar_app/config' );
var ar_app;
function get_ar_app( callback ){
  if ( ar_app ) {
    if ( ar_app.is_running ) callback( null, ar_app );
    else ar_app.on( 'run', callback.bind( null, null, ar_app ) );
    return;
  }

  ar_app = tests_tools.get_new_app( ar_config, {
    run_callback : callback,
    run          : true
  } );
}


function command_test( command, tests ){
  var test = {
    'AR Application' : {
      topic : function(){
        get_ar_app( this.callback );
      },
      'command' : {
        topic : function( app ){
          return app.models.post;
        }
      }
    }
  }

  test[ 'AR Application' ][ 'command' ][ command ] = tests;

  return test;
}


vows.describe( 'active record' )
.addBatch( tests_tools.prepare_base() )
.addBatch( tests_tools.prepare_tables(
  'users', 'profiles', 'posts', 'comments', 'categories', 'post_category', 'orders', 'items' ) )

.addBatch({

  'AR Application' : {
    topic : function(){
      get_ar_app( this.callback );
    },

    '.models.post' : {
      topic : function( app ){
        return app.models.post;
      },

      '.db_connection' : function( post ){
        var app = this.context.topics[1];
        assert.equal( post.db_connection, app.db );
      },

      '.table_name' : function( post ){
        assert.equal( post.table_name, 'posts' );
      },

      '.table' : {
        topic : function( post ) {
          return post.table;
        },

        'should be instance of DbTableSchema' : function( table ){
          assert.instanceOf( table, DbTableSchema );
        },

        '.primary_key' : function( table ){
          assert.equal( table.primary_key, 'id' );
        },

        '.in_sequence' : function( table ){
          assert.isTrue( table.in_sequence );
        },

        '.get_attributes()' : {
          topic : function( table, post ){
            return post.get_attributes();
          },

          'test' : function( attrs ) {
            assert.deepEqual( attrs, {
              id          : null,
              title       : null,
              create_time : null,
              author_id   : null
            } );
          }
        }
      },

      '.get_command_builder()' : function( post ){
        assert.instanceOf( post.get_command_builder(), CommandBuilder );
      }
    },

    'new models.post' : {
      topic : function( app ){
        return new app.models.post;
      },

      'should be instance of Post' : function( post ){
        assert.instanceOf( post, Post );
      },

      '.id should be null' : function( post ){
        assert.isNull( post.id );
      },

      '.title should be null' : function( post ){
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
    }
  }

})
.addBatch( command_test( 'find', {

  'without params' : {
    topic : function( post ) {
      return post.find();
    },

    'should return first entry' : function( e, result ){
      assert.instanceOf( result, Post );
      assert.equal( result.id, 1 );
    }
  },

  'by condition' : {
    topic : function( post ) {
      return post.find( 'id=5' );
    },
    'should return post with id=5' : function( e, result ){
      assert.instanceOf( result, Post );
      assert.equal( result.id, 5 );
    }
  },

  'by condition and params' : {
    topic : function( post ) {
      return post.find( 'id=:id', { id : 2 } );
    },
    'should return post with id=2' : function( e, result ){
      assert.instanceOf( result, Post );
      assert.equal( result.id, 2 );
    }
  },

  'by hash of params' : {
    topic : function( post ) {
      return post.find( {
        condition : 'id=:id',
        params    : { id : 3 }
      });
    },
    'should return post with id=2' : function( e, result ){
      assert.instanceOf( result, Post );
      assert.equal( result.id, 3 );
    }
  },

  'not existed entry' : {
    topic : function( post ) {
      return post.find( 'id=6' );
    },
    'should return null' : function( e, result ){
      assert.isNull( result );
    }
  },

  'find_all' : {
    'without params' : {
      topic : function( post ) {
        return post.find_all();
      },
      'should return array of 5 posts' : function( e, posts ){
        assert.lengthOf( posts, 5 );
        assert.instanceOf( posts[2], Post );
        assert.equal( posts[3].id, 4 );
      }
    },
    'by criteria' : {
      topic : function( post ) {
        return post.find_all( new DbCriteria({
          limit   : 3,
          offset  : 1
        }) );
      },
      'should return array of 3 posts' : function( e, posts ){
        assert.lengthOf( posts, 3 );
        assert.instanceOf( posts[2], Post );
        assert.equal( posts[2].id, 4 );
      }
    },
    'without result' : {
      topic : function( post ) {
        return post.find_all( 'id=6' );
      },
      'should return empty array' : function( e, posts ){
        assert.isEmpty( posts );
      }
    }
  },

  'find_by_pk' : {
    'by single pk' : {
      topic : function( post ) {
        return post.find_by_pk(2);
      },
      'should return post with id=2' : function( e, post ){
        assert.instanceOf( post, Post );
        assert.equal( post.id, 2 );
      }
    },
    'by multi pks' : {
      topic : function( post ) {
        return post.find_by_pk( [3,2] );
      },
      'should return only one post with id=2' : function( e, post ){
        assert.instanceOf( post, Post );
        assert.equal( post.id, 2 );
      }
    },
    'by empty array' : {
      topic : function( post ) {
        return post.find_by_pk( [] );
      },
      'should return null' : function( e, post ){
        assert.isNull( post );
      }
    },
    'by id witch is not exist' : {
      topic : function( post ) {
        return post.find_by_pk( 6 );
      },
      'should return null' : function( e, post ){
        assert.isNull( post );
      }
    }
  },

  'find_all_by_pk' : {
    'by single id' : {
      topic : function( post ) {
        return post.find_all_by_pk( 2 );
      },
      'should return array with single entry' : function( e, posts ){
        assert.equal( posts[0].id, 2 );
      }
    },
    'by multi id with condition' : {
      topic : function( post ) {
        return post.find_all_by_pk( [4,3,2], 'id<4' );
      },
      'should return array with 2 entries' : function( e, posts ){
        assert.lengthOf( posts, 2 );
        assert.equal( posts[0].id, 2 );
        assert.equal( posts[1].id, 3 );
      }
    },
    'by empty array' : {
      topic : function( post ) {
        return post.find_all_by_pk( [] );
      },
      'should return empty array' : function( e, posts ){
        assert.isEmpty( posts );
      }
    }
  },

  'find_by_attributes' : {
    topic : function( post ) {
      return post.find_by_attributes( { author_id : 2 }, { order : 'id DESC' } );
    },
    'should return post with id=4' : function( e, post ){
      assert.equal( post.id, 4 );
    }
  },

  'find_all_by_attributes' : {
    topic : function( post ) {
      return post.find_all_by_attributes( { author_id : 2 } );
    },
    'should return array with 3 items' : function( e, posts ){
      assert.lengthOf( posts, 3 );
    }
  },

  'find_by_sql' : {
    topic : function( post ) {
      return post.find_by_sql( 'select * from posts where id=:id', { id : 2 } );
    },
    'should return post with id=2' : function( e, post ){
      assert.equal( post.id, 2 );
    }
  },

  'find_all_by_sql' : {
    topic : function( post ) {
      return post.find_all_by_sql( 'select * from posts where id>:id', { id : 2 } );
    },
    'should return array with 3 items' : function( e, posts ){
      assert.lengthOf( posts, 3 );
    }
  }

}))
.addBatch( command_test( 'count', {

  'without params' : {
    topic : function( post ) {
      return post.count();
    },
    'should return 5' : function( e, count ){
      assert.isNull( e );
      assert.equal( count, 5 );
    }
  },

  'with condition' : {
    topic : function( post ) {
      return post.count( {
        condition : 'id>2'
      } );
    },
    'should return 3' : function( e, count ){
      assert.equal( count, 3 );
    }
  },

  'count_by_sql' : {
    topic : function( post ) {
      return post.count_by_sql( 'select id from posts limit 1' );
    },
    'should return 1' : function( e, count ){
      assert.equal( count, 1 );
    }
  },

  'count by attributes' : {
    topic : function( app ) {
      return app.models.post.count_by_attributes( {
        author_id : 2
      } );
    },

    'should return 3' : function( err, count ){
      assert.isNull( err );
      assert.equal( count, 3 );
    }
  }
}))


.addBatch( command_test( 'insert:', {

  'new post' : {
    'should have blank attributes' : function( post ) {
      assert.deepEqual( post.get_attributes(), {
        id          : null,
        title       : null,
        create_time : null,
        author_id   : null
      } );
    },

    'set attributes one by one' : function( post ){
      post.title        = 'new post';
      post.create_time  = new Date;
      post.author_id    = 1;

      assert.isTrue( post.is_new );
      assert.isNull( post.id );
    },

    'save' : {
      topic : function( post ) {
        return post.save();
      },
      'check success' : function( e, result ) {
        assert.isNull( e );
      },
      'attributes' : {
        topic : function( result, post ) {
          return post;
        },

        'should be updated' : function( post ) {
          assert.deepEqual( post.get_attributes(), {
            id          : 6,
            title       : 'new post',
            create_time : post.create_time,
            author_id   : 1
          } );
          assert.isFalse( post.is_new );
        }
      }
    }
  }
}))


.addBatch( command_test( 'update', {
  'found record' : {
    topic : function( post ) {
      return post.find_by_pk( 1 );
    },
    'should not be new' : function( err, record ){
      assert.isNull( err );
      assert.isFalse( record.is_new );
      assert.equal( record.title, 'post 1' );
    },
    'updated and saved' : {
      topic : function( record ) {
        var self = this;

        record.title = 'test post 1';
        record.save().on( 'success', function() {
          self.callback( null, record );
        } );
      },
      'should not be new' : function( err, record ){
        assert.isNull( err );
        assert.isFalse( record.is_new );
        assert.equal( record.title, 'test post 1' );
      },
      'should be found in base' : {
        topic : function( record, app ) {
          return app.models.post.find_by_pk( 1 );
        },
        'with new attributes' : function( err, record ) {
          assert.isNull( err );
          assert.equal( record.title, 'test post 1' );
        }
      }
    }
  },

  'update_by_pk' : {
    topic : function( app ) {
      return app.models.post.update_by_pk( [ 4, 5 ], {
        title : 'test post 4 or 5'
      } );
    },
    'should update two record without errors' : function( err, result ){
      assert.isNull( err );
    },
    'should update record with id 4: ' : {
      topic : function( res, app ) {
        return app.models.post.find_by_pk( 4 );
      },
      'check title' : function( err, record ){
        assert.isNull( err );
        assert.equal( record.title, 'test post 4 or 5' );
      }
    },
    'should update record with id 5: ' : {
      topic : function( res, app ) {
        return app.models.post.find_by_pk( 5 );
      },
      'check title' : function( err, record ){
        assert.isNull( err );
        assert.equal( record.title, 'test post 4 or 5' );
      }
    },
    'should not update record with id 2: ' : {
      topic : function(res, app) {
        return app.models.post.find_by_pk( 2 );
      },
      'check title' : function( err, record ){
        assert.isNull( err );
        assert.equal( record.title, 'post 2' );
      }
    }
  }
}))

.addBatch( command_test( 'update_all', {

  topic : function( app ) {
    return app.models.post.update_all( {
      title : 'test post'
    }, 'id=5' );
  },
  'should work without errors' : function( err, result ) {
    assert.isNull( err );
  },
  'should update' : {
    topic : function( res, app ) {
      return app.models.post.find_by_pk( 5 );
    },
    'record with id 5' : function( err, record ){
      assert.equal( record.title, 'test post' );
    }
  }
}))


.addBatch( command_test( 'update_counters', {

  'save current info' : {
    topic : function( post, app ) {
      var counts  = {};
      var self    = this;

      var get_listener = function( post_id ) {
        return function( record ) {
          counts[ post_id ] = record.author_id;

          if ( Object.keys( counts ).length == 3 ) self.callback( null, counts );
        }
      }

      app.models.post.find_by_pk( 2 ).on( 'success', get_listener( 2 ) );
      app.models.post.find_by_pk( 3 ).on( 'success', get_listener( 3 ) );
      app.models.post.find_by_pk( 4 ).on( 'success', get_listener( 4 ) );
    },
    'check exist counters' : function( counts ){
      assert.deepEqual( counts, {
        2 : 2,
        3 : 2,
        4 : 2
      } );
    },
    'decrease counts by condition' : {
      topic : function( counts, post, app ) {
        return app.models.post.update_counters( {
          author_id : -1
        }, 'id>2 and id<=5' );
      },
      'should change author_id' : {
        topic : function( res, counts, post, app ) {
          var counts  = {};
          var self    = this;

          var get_listener = function( post_id ) {
            return function( record ) {
              counts[ post_id ] = record.author_id;

              if ( Object.keys( counts ).length == 2 ) self.callback( null, counts );
            }
          }

          app.models.post.find_by_pk( 2 ).on( 'success', get_listener( 2 ) );
          app.models.post.find_by_pk( 3 ).on( 'success', get_listener( 3 ) );
        },
        'of some records' : function( counts ){
          assert.deepEqual( counts, {
            2 : 2,
            3 : 1
          } );
        }
      }
    }
  }
}))

.addBatch( command_test( 'delete', {
  'single record' : {
    topic : function( post, app ) {
      var self = this;

      app.models.post.find_by_pk( 1 ).on( 'success', function( record ) {
        record.remove().on( 'success', function() {
          app.models.post.find_by_pk( 1 ).on( 'success', function( record ) {
            self.callback( null, record );
          } );
        } );
      } );
    },

    'should not be found' : function( err, record ){
      assert.isNull( err );
      assert.isNull( record );
    },

    'should not touch other records' : {
      topic : function( record, app ) {
        return app.models.post.find_all_by_pk( [ 2, 3 ] );
      },

      'with id 2 and 3' : function( records ){
        assert.lengthOf( records, 2 );
      },

      'and we can delete them too' : {
        topic : function( res, record, app ) {
          var self = this;

          app.models.post.remove_by_pk( [ 2, 3 ] ).on( 'success', function() {
            app.models.post.find_all_by_pk( [ 2, 3 ] ).on( 'success', function( records ) {
              self.callback( null, records );
            } );
          } )
        },

        'and there is no this records' : function( err, records ){
          assert.isNull( err );
          assert.isEmpty( records );
        }
      }
    }
  },

  'remove all' : {
    topic : function( post, app ) {
      var self = this;
      app.models.post.remove_all( 'id=5' ).on( 'success', function() {
        app.models.post.find_by_pk( 5 ).on( 'success', function( record ) {
          self.callback( null, record );
        } );
      } );
    },
    'should delete last record' : function( err, record ){
      assert.isNull( record );
    }
  }
}))

.addBatch( tests_tools.prepare_base() )
.addBatch( tests_tools.prepare_tables(
  'users', 'profiles', 'posts', 'comments', 'categories', 'post_category', 'orders', 'items' ) )


.addBatch( command_test( 'refresh', {

  'refresh' : {
    topic : function( post, app ) {
      var actions = 0;
      var records = {};
      var self    = this;

      var get_listener = function( n, change_title ) {
        return function( record ) {
          if ( change_title ) {
            record.title = 'new title';
            record.save().on( 'success', function() {
              if ( ++actions == 3 ) self.callback( null, records );
            } );
          }

          records[ n ] = record;
          if ( ++actions == 3 ) self.callback( null, records );
        }
      }

      app.models.post.find_by_pk( 1 ).on( 'success', get_listener( 1, false ) );
      app.models.post.find_by_pk( 1 ).on( 'success', get_listener( 2, true ) );
    },

    'before refresh' : function( err, records ){
      assert.equal( records[ 1 ].title, 'post 1' );
    },

    'after_refresh' : {
      topic : function( records ) {
        var self = this;

        records[ 1 ].refresh().on( 'success', function() {
          self.callback( null, records );
        } );
      },

      'attributes should be updated' : function( err, records ){
        assert.equal( records[ 1 ].title, 'new title' );
      }
    }
  }
}))

.addBatch( tests_tools.prepare_base() )
.addBatch( tests_tools.prepare_tables(
  'users', 'profiles', 'posts', 'comments', 'categories', 'post_category', 'orders', 'items' ) )


.addBatch({
  'AR Application' : {
    topic : function(){
      get_ar_app( this.callback );
    },

    '.models.order.table' : {
      topic : function( app ) {
        return app.models.order.table;
      },

      '.primary_key' : function( table ){
        assert.deepEqual( table.primary_key, [ 'key1', 'key2' ] );
      },

      '.find_by_pk()' : {
        topic : function( table, app ) {
          return app.models.order.find_by_pk({
            key1 : 2,
            key2 : 1
          });
        },
        'result' : function( err, record ) {
          assert.isNull( err );
          assert.equal( record.name, 'order 21' );
        }
      },

      '.find_all_by_pk()' : {
        topic : function( table, app ) {
          return app.models.order.find_all_by_pk([
            {
              key1 : 2,
              key2 : 1
            },
            {
              key1 : 1,
              key2 : 3
            }
          ]);
        },
        'result' : function( err, records ) {
          assert.isNull( err );
          assert.equal( records[0].name, 'order 13' );
          assert.equal( records[1].name, 'order 21' );
        }
      }
    },

    'public attributes' : {
      'in blank' : {
        topic : function( app ) {
          var post = new app.models.post_ext;
          return post.get_attributes();
        },
        'post' : function( attributes ){
          assert.deepEqual( attributes, {
            id          : null,
            title       : 'default title',
            create_time : null,
            author_id   : null
          } );
        }
      },
      'in exist' : {
        topic : function( app ) {
          var self = this;

          app.models.post_ext.find_by_pk( 1 ).on( 'success', function( post ) {
            self.callback( null, post.get_attributes() );
          } );
        },
        'post' : function( e, attributes ){
          assert.isNull( e );
          assert.deepEqual( attributes, {
            id          : 1,
            title       : 'post 1',
            create_time : new Date( 'Sat, 01 Jan 2000 00:00:00 GMT' ),
            author_id   : 1
          } );
        }
      },
      'in new' : {
        topic : function( app ) {
          var self = this;
          var post = new app.models.post_ext;

          post.title        = "test post";
          post.create_time  = 1000000;
          post.author_id    = 1;
          post.save().on( 'success', function() {
            self.callback( null, post.get_attributes() );
          } );
        },
        'post' : function( e, attributes ){
          assert.isNull( e );
          assert.deepEqual( attributes, {
            id          : 6,
            title       : 'test post',
            create_time : 1000000,
            author_id   : 1
          } );
        }
      }
    },

    'exists' : {
      'with id 1' : {
        topic : function( app ) {
          return app.models.post.exists( 'id=:id', {
            id : 1
          } );
        },
        'should exist' : function( err, exist ){
          assert.isNull( err );
          assert.isTrue( exist );
        }
      },
      'with id 8' : {
        topic : function( app ) {
          return app.models.post.exists( 'id=:id', {
            id : 8
          } );
        },
        'should not exist' : function( err, exist ){
          assert.isNull( err );
          assert.isFalse( exist );
        }
      }
    }
  }
})
.export( module );



//	public function testDefault()
//	{
//		$type=new ComplexType;
//		$this->assertEquals(1,$type->int_col2);
//		$this->assertEquals('something',$type->char_col2);
//		$this->assertEquals(1.23,$type->float_col2);
//		$this->assertEquals(33.22,$type->numeric_col);
//		$this->assertEquals(123,$type->time);
//		$this->assertEquals(null,$type->bool_col);
//		$this->assertEquals(true,$type->bool_col2);
//	}
//
//	public function testEquals()
//	{
//		$post=Post::model()->findByPk(1);
//		$post2=Post::model()->findByPk(1);
//		$post3=Post::model()->findByPk(3);
//		$this->assertEquals(1,$post->primaryKey);
//		$this->assertTrue($post->equals($post2));
//		$this->assertTrue($post2->equals($post));
//		$this->assertFalse($post->equals($post3));
//		$this->assertFalse($post3->equals($post));
//	}
//
//	public function testValidation()
//	{
//		$user=new User;
//		$user->password='passtest';
//		$this->assertFalse($user->hasErrors());
//		$this->assertEquals(array(),$user->errors);
//		$this->assertEquals(array(),$user->getErrors('username'));
//		$this->assertFalse($user->save());
//		$this->assertNull($user->id);
//		$this->assertTrue($user->isNewRecord);
//		$this->assertTrue($user->hasErrors());
//		$this->assertTrue($user->hasErrors('username'));
//		$this->assertTrue($user->hasErrors('email'));
//		$this->assertFalse($user->hasErrors('password'));
//		$this->assertEquals(1,count($user->getErrors('username')));
//		$this->assertEquals(1,count($user->getErrors('email')));
//		$this->assertEquals(2,count($user->errors));
//
//		$user->clearErrors();
//		$this->assertFalse($user->hasErrors());
//		$this->assertEquals(array(),$user->errors);
//	}
//
