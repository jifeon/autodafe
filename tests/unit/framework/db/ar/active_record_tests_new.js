exports.get_batch = function( application, assert ) {
  var Post            = require('models/post');
  var DbTableSchema   = require('db/db_table_schema');
  var DbCriteria      = require('db/db_criteria');
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

    'command' : {
      topic : application.models.post,
      'find' : {
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
        }
      },

      'find_all' : {
        'without params' : {
          topic : function( post ) {
            return post.find_all();
          },
          'should return array of 5 posts' : function( e, posts ){
            assert.length( posts, 5 );
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
            assert.length( posts, 3 );
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
            assert.length( posts, 2 );
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
          assert.length( posts, 3 );
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
          assert.length( posts, 3 );
        }
      }//,

//      'count' : {
//        'without params' : {
//          topic : function( post ) {
//            return post.count();
//          },
//          'should return 5' : function( e, count ){
//            assert.equal( count, 5 );
//          }
//        },
//        'with condition' : {
//          topic : function( post ) {
//            return post.count( {
//              condition : 'id>2'
//            } );
//          },
//          'should return 3' : function( e, count ){
//            assert.equal( count, 3 );
//          }
//        }
//      },

//      'count_by_sql' : {
//        topic : function( post ) {
//          return post.count_by_sql( 'select id from posts limit 1' );
//        },
//        'should return 1' : function( e, count ){
//          assert.equal( count, 1 );
//        }
//      }
    },

    'insert' : {
      topic : function() {
        application.models.post.get_table( this.callback );
      },
      'into table' : {
        topic : function( table ) {
          return {
            table : table,
            post  : new application.models.post
          }
        },
        'check attributes' : function( topic ) {
          assert.deepEqual( topic.post.get_attributes( topic.table ), {
            id          : null,
            title       : null,
            create_time : null,
            author_id   : null,
            content     : null
          } );
        },
        'set attributes one by one' : function( topic ){
          var post = topic.post;

          post.title        = 'test post 1';
          post.create_time  = new Date;
          post.author_id    = 1;
          post.content      = 'test post content 1';

          assert.isTrue( post.is_new );
          assert.isNull( post.id );
        },
        'save' : {
          topic : function( topic ) {
            return topic.post.save();
          },
          'check success' : function( e, result ) {
            assert.isNull( e );
          },
          'attributes' : {
            topic : function( result, topic ) {
              return topic;
            },
            'should be updated' : function( topic ) {
              var post = topic.post;

              assert.deepEqual( post.get_attributes( topic.table ), {
                id          : 6,
                title       : 'test post 1',
                create_time : post.create_time,
                author_id   : 1,
                content     : 'test post content 1'
              } );
              assert.isFalse( post.is_new );
            }
          }
        }
      }
    }
  }
}



//	public function testUpdate()
//	{
//		// test save
//		$post=Post::model()->findByPk(1);
//		$this->assertFalse($post->isNewRecord);
//		$this->assertEquals('post 1',$post->title);
//		$post->title='test post 1';
//		$this->assertTrue($post->save());
//		$this->assertFalse($post->isNewRecord);
//		$this->assertEquals('test post 1',$post->title);
//		$this->assertEquals('test post 1',Post::model()->findByPk(1)->title);
//
//		// test updateByPk
//		$this->assertEquals(2,Post::model()->updateByPk(array(4,5),array('title'=>'test post')));
//		$this->assertEquals('post 2',Post::model()->findByPk(2)->title);
//		$this->assertEquals('test post',Post::model()->findByPk(4)->title);
//		$this->assertEquals('test post',Post::model()->findByPk(5)->title);
//
//		// test updateAll
//		$this->assertEquals(1,Post::model()->updateAll(array('title'=>'test post'),'id=1'));
//		$this->assertEquals('test post',Post::model()->findByPk(1)->title);
//
//		// test updateCounters
//		$this->assertEquals(2,Post::model()->findByPk(2)->author_id);
//		$this->assertEquals(2,Post::model()->findByPk(3)->author_id);
//		$this->assertEquals(2,Post::model()->findByPk(4)->author_id);
//		$this->assertEquals(3,Post::model()->updateCounters(array('author_id'=>-1),'id>2'));
//		$this->assertEquals(2,Post::model()->findByPk(2)->author_id);
//		$this->assertEquals(1,Post::model()->findByPk(3)->author_id);
//	}
//
//	public function testDelete()
//	{
//		$post=Post::model()->findByPk(1);
//		$this->assertTrue($post->delete());
//		$this->assertNull(Post::model()->findByPk(1));
//
//		$this->assertTrue(Post::model()->findByPk(2) instanceof Post);
//		$this->assertTrue(Post::model()->findByPk(3) instanceof Post);
//		$this->assertEquals(2,Post::model()->deleteByPk(array(2,3)));
//		$this->assertNull(Post::model()->findByPk(2));
//		$this->assertNull(Post::model()->findByPk(3));
//
//		$this->assertTrue(Post::model()->findByPk(5) instanceof Post);
//		$this->assertEquals(1,Post::model()->deleteAll('id=5'));
//		$this->assertNull(Post::model()->findByPk(5));
//	}
//
//	public function testRefresh()
//	{
//		$post=Post::model()->findByPk(1);
//		$post2=Post::model()->findByPk(1);
//		$post2->title='new post';
//		$post2->save();
//		$this->assertEquals('post 1',$post->title);
//		$this->assertTrue($post->refresh());
//		$this->assertEquals('new post',$post->title);
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
//	public function testCompositeKey()
//	{
//		$order=new Order;
//		$this->assertEquals(array('key1','key2'),$order->tableSchema->primaryKey);
//		$order=Order::model()->findByPk(array('key1'=>2,'key2'=>1));
//		$this->assertEquals('order 21',$order->name);
//		$orders=Order::model()->findAllByPk(array(array('key1'=>2,'key2'=>1),array('key1'=>1,'key2'=>3)));
//		$this->assertEquals('order 13',$orders[0]->name);
//		$this->assertEquals('order 21',$orders[1]->name);
//	}
//
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
//	public function testPublicAttribute()
//	{
//		$post=new PostExt;
//		$this->assertEquals(array('id'=>null,'title'=>'default title','create_time'=>null,'author_id'=>null,'content'=>null),$post->attributes);
//		$post=Post::model()->findByPk(1);
//		$this->assertEquals(array(
//			'id'=>1,
//			'title'=>'post 1',
//			'create_time'=>100000,
//			'author_id'=>1,
//			'content'=>'content 1'),$post->attributes);
//
//		$post=new PostExt;
//		$post->title='test post';
//		$post->create_time=1000000;
//		$post->author_id=1;
//		$post->content='test';
//		$post->save();
//		$this->assertEquals(array(
//			'id'=>6,
//			'title'=>'test post',
//			'create_time'=>1000000,
//			'author_id'=>1,
//			'content'=>'test'),$post->attributes);
//	}
//	public function testCountByAttributes()
//	{
//		$n=Post::model()->countByAttributes(array('author_id'=>2));
//		$this->assertEquals(3,$n);
//
//	}

//
//
//		// test exists
//		$this->assertTrue(Post::model()->exists('id=:id',array(':id'=>1)));
//		$this->assertFalse(Post::model()->exists('id=:id',array(':id'=>6)));
//	}