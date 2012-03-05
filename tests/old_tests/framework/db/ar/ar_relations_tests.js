exports.get_batch = function( application, assert ) {
  var User      = require( 'autodafe/tests/test_app/models/user' );
  var Comment   = require( 'autodafe/tests/test_app/models/comment' );
  var Category  = require( 'autodafe/tests/test_app/models/category' );
  var Order     = require( 'autodafe/tests/test_app/models/order' );
  var Post      = require( 'autodafe/tests/test_app/models/post' );

  function lazy_relation_stat_test( model, count, related, related_counts ){
    var tests = {
      topic : function(){
        return application.models[ model ].find_all();
      },
      'check count' : function( err, records ){
        assert.isNull( err );
        assert.lengthOf( records, count );
      }
    }

    related_counts.forEach( function( related_count, i ){
      var test_name = model + 's[' + i + '].';
      tests[ test_name ] = {
        topic : function( records ){
          return records[ i ].get_related( related );
        }
      }

      tests[ test_name ][ related ] = function( err, count ){
        assert.isNull( err );
        assert.equal( count, related_count );
      }
    } );

    return tests;
  }

  return {
    'lazy relation' : {
      topic : function() {
        return application.models.post.find_by_pk( 2 );
      },
      'belongs_to' : {
        topic : function( post ) {
          return post.get_related( 'author' );
        },
        'author' : function( err, author ){
          assert.isNull( err );
          assert.instanceOf( author, User );
          assert.deepEqual( author.get_attributes(), {
            id       : 2,
            username : 'user2',
            password : 'pass2',
            email    : 'email2'
          } );
        }
      },
      'has_one exist' : {
        topic : function( post ){
          return post.get_related( 'first_comment' );
        },
        'first_comment' : function( err, comment ){
          assert.isNull( err );
          assert.instanceOf( comment, Comment );
          assert.deepEqual( comment.get_attributes(), {
            id        : 4,
            content   : 'comment 4',
            post_id   : 2,
            author_id : 2
          } );
        }
      },
      'has_one not exist' : {
        topic : function(){
          var self = this;
          application.models.post.find_by_pk( 4 ).on( 'success', function( post ) {
            post.get_related( 'first_comment' )
              .on( 'success', function( comment ){
                self.callback( null, comment );
              } )
              .on( 'error', function( err ){
                self.callback( err );
              } );
          } );
        },
        'first_comment' : function( err, comment ){
          assert.isNull( err );
          assert.isNull( comment );
        }
      },
      'has_many exist' : {
        topic : function( post ){
          return post.get_related( 'comments' );
        },
        'comments' : function( err, comments ){
          assert.isNull( err );
          assert.lengthOf( comments, 2 );
          assert.deepEqual( comments[0].get_attributes(), {
            id        : 5,
            content   : 'comment 5',
            post_id   : 2,
            author_id : 2
          } );
          assert.deepEqual( comments[1].get_attributes(), {
            id        : 4,
            content   : 'comment 4',
            post_id   : 2,
            author_id : 2
          } );
        }
      },
      'has_many not exist' : {
        topic : function( post ){
          var self = this;

          application.models.post.find_by_pk( 4 ).on( 'success', function( post ) {
            post.get_related( 'comments' )
              .on( 'success', function( comments ){
                self.callback( null, comments );
              } )
              .on( 'error', function( err ){
                self.callback( err );
              } );
          } );
        },
        'comments' : function( err, comments ){
          assert.isNull( err );
          assert.lengthOf( comments, 0 );
        }
      },
      'many_many exist' : {
        topic : function( post ){
          return post.get_related( 'categories' );
        },
        'categories' : function( err, categories ){
          assert.isNull( err );
          assert.lengthOf( categories, 2 );
          assert.deepEqual( categories[0].get_attributes(), {
            id        : 1,
            name      : 'cat 1',
            parent_id : null
          } );
          assert.deepEqual( categories[1].get_attributes(), {
            id        : 4,
            name      : 'cat 4',
            parent_id : 1
          } );
        }
      },
      'many_many not exist' : {
        topic : function(){
          var self = this;

          application.models.post.find_by_pk( 4 ).on( 'success', function( post ) {
            post.get_related( 'categories' )
              .on( 'success', function( categories ){
                self.callback( null, categories );
              } )
              .on( 'error', function( err ){
                self.callback( err );
              } );
          } );
        },
        'categories' : function( err, categories ){
          assert.isNull( err );
          assert.lengthOf( categories, 0 );
        }
      },
      'self join 1' : {
        topic : function() {
          return application.models.category.find_by_pk( 5 );
        },
        'category posts' : {
          topic : function( category ) {
            return category.get_related( 'posts' );
          },
          'check' : function( err, posts ){
            assert.isNull( err );
            assert.lengthOf( posts, 0 );
          }
        },
        'category children' : {
          topic : function( category ) {
            return category.get_related( 'children' );
          },
          'check length' : function( err, children ){
            assert.isNull( err );
            assert.lengthOf( children, 2 );
          },
          'check attrs' : function( err, children ){
            assert.deepEqual( children[0].get_attributes(), {
              id        : 6,
              name      : 'cat 6',
              parent_id : 5
            } );
            assert.deepEqual( children[1].get_attributes(), {
              id        : 7,
              name      : 'cat 7',
              parent_id : 5
            } );
          }
        },
        'category parent' : {
          topic : function( category ) {
            return category.get_related( 'parent' );
          },
          'check' : function( err, parent ){
            assert.isNull( err );
            assert.instanceOf( parent, Category );
            assert.deepEqual( parent.get_attributes(), {
              id        : 1,
              name      : 'cat 1',
              parent_id : null
            } );
          }
        }
      },
      'self join 2' : {
        topic : function() {
          return application.models.category.find_by_pk( 2 );
        },
        'category posts' : {
          topic : function( category ) {
            return category.get_related( 'posts' );
          },
          'check' : function( err, posts ){
            assert.isNull( err );
            assert.lengthOf( posts, 1 );
          }
        },
        'category children' : {
          topic : function( category ) {
            return category.get_related( 'children' );
          },
          'check length' : function( err, children ){
            assert.isNull( err );
            assert.lengthOf( children, 0 );
          }
        },
        'category parent' : {
          topic : function( category ) {
            return category.get_related( 'parent' );
          },
          'check' : function( err, parent ){
            assert.isNull( err );
            assert.isNull( parent );
          }
        }
      },
      'composite key order 1,2' : {
        topic : function(){
          var self = this;

          application.models.order.find_by_pk( {
            key1 : 1,
            key2 : 2
          } )
            .on( 'success', function( order ){
              order.get_related( 'items' )
                .on( 'success', function( items ){
                  self.callback( null, items );
                } )
                .on( 'error', function( err ){
                  self.callback( err );
                } );
            } )
        },
        'check count of items' : function( err, items ){
          assert.isNull( err );
          assert.lengthOf( items, 2 );
        }
      },
      'composite key order 2,1' : {
        topic : function(){
          var self = this;

          application.models.order.find_by_pk( {
            key1 : 2,
            key2 : 1
          } )
            .on( 'success', function( order ){
              order.get_related( 'items' )
                .on( 'success', function( items ){
                  self.callback( null, items );
                } )
                .on( 'error', function( err ){
                  self.callback( err );
                } );
            } )
        },
        'check count of items' : function( err, items ){
          assert.isNull( err );
          assert.lengthOf( items, 0 );
        }
      },
      'composite key item 4' : {
        topic : function(){
          var self = this;

          application.models.item.find_by_pk( 4 )
            .on( 'success', function( item ){
              item.get_related( 'order' )
                .on( 'success', function( order ){
                  self.callback( null, order );
                } )
                .on( 'error', function( err ){
                  self.callback( err );
                } );
            } )
        },
        'check order' : function( err, order ){
          assert.isNull( err );
          assert.instanceOf( order, Order );
          assert.deepEqual( order.get_attributes(), {
            key1 : 2,
            key2 : 2,
            name : 'order 22'
          } )
        }
      }
    },
    'eager relation 1' : test_eager_relation( function() {
      return application.models.post.With( 'author', 'first_comment', 'comments', 'categories' ).find_by_pk(2);
    } ),
    'eager relation 2' : test_eager_relation( function() {
      return application.models.post.With( 'author', 'first_comment', 'comments', 'categories' ).find_by_pk(2);
    } ),
    'eager relation 3' : test_eager_relation( function() {
      return application.models.post.find_by_pk( 2, {
        With : [ 'author', 'first_comment', 'comments', 'categories' ]
      } );
    } ),
    'eager relation 4' : {
      topic : function() {
        return application.models.post.With( 'author', 'first_comment', 'comments', 'categories' ).find_by_pk(4);
      },
      'check' : function( err, post ) {
        assert.isNull( err );
        assert.instanceOf( post, Post );
        assert.instanceOf( post.author, User );
        assert.deepEqual( post.author.get_attributes(), {
          id        : 2,
          username  : 'user2',
          password  : 'pass2',
          email     : 'email2'
        } );
        assert.isNull( post.first_comment );
        assert.lengthOf( post.comments, 0 );
        assert.lengthOf( post.categories, 0 );

      }
    },

    'lazy recursive relation' : {
      topic : function(){
        return application.models.post_ext.find_by_pk(2);
      },
      'post_ext.comments' : {
        topic : function( post ){
          return post.get_related( 'comments' );
        },
        'check' : function( err, comments ){
          assert.isNull( err );
          assert.lengthOf( comments, 2 );
          assert.instanceOf( comments[0].post, Post );
          assert.instanceOf( comments[1].post, Post );
          assert.instanceOf( comments[0].author, User );
          assert.instanceOf( comments[1].author, User );
        },
        '[0].author.' : {
          topic : function( comments ){
            return comments[0].author.get_related( 'posts' );
          },
          'posts' : function( err, posts ){
            assert.isNull( err );
            assert.lengthOf( posts, 3 );
          },
          'posts.' : {
            topic : function( posts ) {
              return posts[1].get_related( 'author' );
            },
            'author' : function( err, author ){
              assert.instanceOf( author, User );
            }
          }
        },
        '[1].author.' : {
          topic : function( comments ){
            return comments[1].author.get_related( 'posts' );
          },
          'posts' : function( err, posts ){
            assert.isNull( err );
            assert.lengthOf( posts, 3 );
          }
        }
      }
    },

    'lazy recursive relation - self join' : {
      topic : function() {
        return application.models.category.find_by_pk(1);
      },
      'category.' : {
        topic : function( category ){
          return category.get_related( 'nodes' );
        },
        'nodes' : function( err, nodes ){
          assert.isNull( err );
          assert.lengthOf( nodes, 2 );
          assert.instanceOf( nodes[0].parent, Category );
          assert.instanceOf( nodes[1].parent, Category );
          assert.lengthOf( nodes[0].children, 0 );
          assert.lengthOf( nodes[1].children, 2 );
        }
      }
    },

    'eager recursive relation' : {
      topic : function() {
        return application.models.post.With( 'comments.author', 'categories' ).find_by_pk(2);
      },
      'check' : function( post ){
        assert.lengthOf( post.comments, 2 );
        assert.lengthOf( post.categories, 2 );
      }
    },

    'eager recursive relation 2' : {
      topic : function() {
        return application.models.post_ext.With( 'comments' ).find_all();
      },
      'check' : function( posts ){
        assert.lengthOf( posts, 5 );
      }
    },

    'eager relation with condition' : {
      topic : function(){
        return application.models.post.With( 'comments' ).find_all_by_pk( [2,3,4], {
          order : 't.id'
        } );
      }
    },






//  public function testRelationWithCondition()
//  {
//    $posts=Post::model()->with('comments')->findAllByPk(array(2,3,4),array('order'=>'t.id'));
//    $this->assertEquals(3,count($posts));
//    $this->assertEquals(2,count($posts[0]->comments));
//    $this->assertEquals(4,count($posts[1]->comments));
//    $this->assertEquals(0,count($posts[2]->comments));
//
//    $post=Post::model()->with('comments')->findByAttributes(array('id'=>2));
//    $this->assertTrue($post instanceof Post);
//    $this->assertEquals(2,count($post->comments));
//    $posts=Post::model()->with('comments')->findAllByAttributes(array('id'=>2));
//    $this->assertEquals(1,count($posts));
//
//    $post=Post::model()->with('comments')->findBySql('select * from posts where id=:id',array(':id'=>2));
//    $this->assertTrue($post instanceof Post);
//    $posts=Post::model()->with('comments')->findAllBySql('select * from posts where id=:id1 OR id=:id2',array(':id1'=>2,':id2'=>3));
//    $this->assertEquals(2,count($posts));
//
//    $post=Post::model()->with('comments','author')->find('t.id=:id',array(':id'=>2));
//    $this->assertTrue($post instanceof Post);
//
//    $posts=Post::model()->with('comments','author')->findAll(array(
//      'select'=>'title',
//      'condition'=>'t.id=:id',
//      'limit'=>1,
//      'offset'=>0,
//      'order'=>'t.title',
//      'group'=>'t.id',
//      'params'=>array(':id'=>2)));
//    $this->assertTrue($posts[0] instanceof Post);
//
//    $posts=Post::model()->with('comments','author')->findAll(array(
//      'select'=>'title',
//      'condition'=>'t.id=:id',
//      'limit'=>1,
//      'offset'=>2,
//      'order'=>'t.title',
//      'params'=>array(':id'=>2)));
//    $this->assertTrue($posts===array());
//  }
//
//  public function testRelationWithColumnAlias()
//  {
//    $users=User::model()->with('posts')->findAll(array(
//      'select'=>'id, username AS username2',
//      'order'=>'username2',
//    ));
//
//    $this->assertEquals(4,count($users));
//    $this->assertEquals($users[1]->username,null);
//    $this->assertEquals($users[1]->username2,'user2');
//  }
//
//  public function testRelationalWithoutFK()
//  {
//    $users=UserNoFk::model()->with('posts')->findAll();
//    $this->assertEquals(4,count($users));
//    $this->assertEquals(3,count($users[1]->posts));
//
//    $posts=PostNoFk::model()->with('author')->findAll();
//    $this->assertEquals(5,count($posts));
//    $this->assertTrue($posts[2]->author instanceof UserNoFk);
//  }
//
//  public function testRelationWithNewRecord()
//  {
//    $user=new User;
//    $posts=$user->posts;
//    $this->assertTrue(is_array($posts) && empty($posts));
//
//    $post=new Post;
//    $author=$post->author;
//    $this->assertNull($author);
//  }
//
//  public function testRelationWithDynamicCondition()
//  {
//    $user=User::model()->with('posts')->findByPk(2);
//    $this->assertEquals($user->posts[0]->id,2);
//    $this->assertEquals($user->posts[1]->id,3);
//    $this->assertEquals($user->posts[2]->id,4);
//    $user=User::model()->with(array('posts'=>array('order'=>'posts.id DESC')))->findByPk(2);
//    $this->assertEquals($user->posts[0]->id,4);
//    $this->assertEquals($user->posts[1]->id,3);
//    $this->assertEquals($user->posts[2]->id,2);
//  }
//
//  public function testEagerTogetherRelation()
//  {
//    $post=Post::model()->with('author','firstComment','comments','categories')->findByPk(2);
//    $comments=$post->comments;
//    $this->assertEquals(array(
//      'id'=>2,
//      'username'=>'user2',
//      'password'=>'pass2',
//      'email'=>'email2'),$post->author->attributes);
//    $this->assertTrue($post->firstComment instanceof Comment);
//    $this->assertEquals(array(
//      'id'=>4,
//      'content'=>'comment 4',
//      'post_id'=>2,
//      'author_id'=>2),$post->firstComment->attributes);
//    $this->assertEquals(2,count($post->comments));
//    $this->assertEquals(array(
//      'id'=>5,
//      'content'=>'comment 5',
//      'post_id'=>2,
//      'author_id'=>2),$post->comments[0]->attributes);
//    $this->assertEquals(array(
//      'id'=>4,
//      'content'=>'comment 4',
//      'post_id'=>2,
//      'author_id'=>2),$post->comments[1]->attributes);
//    $this->assertEquals(2,count($post->categories));
//    $this->assertEquals(array(
//      'id'=>4,
//      'name'=>'cat 4',
//      'parent_id'=>1),$post->categories[0]->attributes);
//    $this->assertEquals(array(
//      'id'=>1,
//      'name'=>'cat 1',
//      'parent_id'=>null),$post->categories[1]->attributes);
//
//    $post=Post::model()->with('author','firstComment','comments','categories')->findByPk(4);
//    $this->assertEquals(array(
//      'id'=>2,
//      'username'=>'user2',
//      'password'=>'pass2',
//      'email'=>'email2'),$post->author->attributes);
//    $this->assertNull($post->firstComment);
//    $this->assertEquals(array(),$post->comments);
//    $this->assertEquals(array(),$post->categories);
//  }
//
//  public function testRelationalCount()
//  {
//    $count=Post::model()->with('author','firstComment','comments','categories')->count();
//    $this->assertEquals(5,$count);
//
//    $count=Post::model()->count(array('with'=>array('author','firstComment','comments','categories')));
//    $this->assertEquals(5,$count);
//
//    $count=Post::model()->with('author','firstComment','comments','categories')->count('t.id=4');
//    $this->assertEquals(1,$count);
//
//    $count=Post::model()->with('author','firstComment','comments','categories')->count('t.id=14');
//    $this->assertEquals(0,$count);
//  }
//
//
//
    'eager relation stat' : {
      topic : function(){
        return application.models.user.With( 'post_count' ).find_all();
      },
      'user with post count' : function( err, users ){
        assert.isNull( err );
        assert.lengthOf( users, 3 );  // todo: replace to 4 after db fixtures are done
        assert.equal( users[0].post_count, 1 );
        assert.equal( users[1].post_count, 3 );
        assert.equal( users[2].post_count, 1 );
      }
    },

    // todo: replace 3 to 4 after db fixtures are done
    'lazy relation stat' : lazy_relation_stat_test( 'user', 3, 'post_count', [ 1,3,1 ] ),

    'eager relation stat 2' : {
      topic : function(){
        return application.models.order.With( 'item_count' ).find_all();
      },
      'order with items count' : function( err, orders ){
        assert.isNull( err );
        assert.lengthOf( orders, 4 );
        assert.equal( orders[0].item_count, 2 );
        assert.equal( orders[1].item_count, 1 );
        assert.equal( orders[2].item_count, 0 );
        assert.equal( orders[3].item_count, 2 );
      }
    },

    'lazy relation stat 2' : lazy_relation_stat_test( 'order', 4, 'item_count', [2,1,0,2] ),

    'eager relation stat 3' : {
      topic : function(){
        return application.models.category.With( 'post_count' ).find_all();
      },
      'order with items count' : function( err, categories ){
        assert.isNull( err );
        assert.lengthOf( categories, 7 );
        assert.equal( categories[0].post_count, 3 );
        assert.equal( categories[1].post_count, 1 );
        assert.equal( categories[2].post_count, 1 );
        assert.equal( categories[3].post_count, 1 );
        assert.equal( categories[4].post_count, 0 );
        assert.equal( categories[5].post_count, 0 );
        assert.equal( categories[6].post_count, 0 );
      }
    },

    'lazy relation stat 3' : lazy_relation_stat_test( 'category', 7, 'post_count', [3,1,1,1,0,0,0] )


//  public function testRelationalStat()
//  {

//
//    $users=User::model()->with('postCount','posts.commentCount')->findAll();
//    $this->assertEquals(4,count($users));
//  }
//
//  public function testScopes()
//  {
//    $posts=Post::model()->post23()->findAll();
//    $this->assertEquals(2,count($posts));
//    $this->assertEquals(2,$posts[0]->id);
//    $this->assertEquals(3,$posts[1]->id);
//
//    $post=Post::model()->post23()->find();
//    $this->assertEquals(2,$post->id);
//
//    $posts=Post::model()->post23()->post3()->findAll();
//    $this->assertEquals(1,count($posts));
//    $this->assertEquals(3,$posts[0]->id);
//
//    $post=Post::model()->post23()->find();
//    $this->assertTrue($post instanceof Post);
//    $this->assertEquals(2,$post->id);
//
//    $posts=Post::model()->post23()->findAll('id=3');
//    $this->assertEquals(1,count($posts));
//    $this->assertEquals(3,$posts[0]->id);
//
//    $posts=Post::model()->recent()->with('author')->findAll();
//    $this->assertEquals(5,count($posts));
//    $this->assertEquals(5,$posts[0]->id);
//    $this->assertEquals(4,$posts[1]->id);
//
//    $posts=Post::model()->recent(3)->findAll();
//    $this->assertEquals(3,count($posts));
//    $this->assertEquals(5,$posts[0]->id);
//    $this->assertEquals(4,$posts[1]->id);
//
//    $posts=PostSpecial::model()->findAll();
//    $this->assertEquals(2,count($posts));
//    $this->assertEquals(2,$posts[0]->id);
//    $this->assertEquals(3,$posts[1]->id);
//
//    $posts=PostSpecial::model()->desc()->findAll();
//    $this->assertEquals(2,count($posts));
//    $this->assertEquals(3,$posts[0]->id);
//    $this->assertEquals(2,$posts[1]->id);
//  }
//
//  public function testResetScope(){
//    // resetting named scope
//    $posts=Post::model()->post23()->resetScope()->findAll();
//    $this->assertEquals(5,count($posts));
//
//    // resetting default scope
//    $posts=PostSpecial::model()->resetScope()->findAll();
//    $this->assertEquals(5,count($posts));
//  }
//
//  public function testLazyLoadingWithConditions()
//  {
//    $user=User::model()->findByPk(2);
//    $posts=$user->posts;
//    $this->assertEquals(3,count($posts));
//    $posts=$user->posts(array('condition'=>'posts.id>=3', 'alias'=>'posts'));
//    $this->assertEquals(2,count($posts));
//  }
//
//  public function testScopeWithRelations()
//  {
//    $user=User::model()->with('posts:post23')->findByPk(2);
//    $this->assertEquals(2,count($user->posts));
//    $this->assertEquals(2,$user->posts[0]->id);
//    $this->assertEquals(3,$user->posts[1]->id);
//
//    $user=UserSpecial::model()->findByPk(2);
//    $posts=$user->posts;
//    $this->assertEquals(2,count($posts));
//    $this->assertEquals(2,$posts[0]->id);
//    $this->assertEquals(3,$posts[1]->id);
//
//    $user=UserSpecial::model()->findByPk(2);
//    $posts=$user->posts(array('params'=>array(':id1'=>4),'order'=>'posts.id DESC'));
//    $this->assertEquals(2,count($posts));
//    $this->assertEquals(4,$posts[0]->id);
//    $this->assertEquals(3,$posts[1]->id);
//  }
//
//  public function testDuplicateLazyLoadingBug()
//  {
//    $user=User::model()->with(array(
//      'posts'=>array('on'=>'posts.id=-1')
//    ))->findByPk(1);
//    // with the bug, an eager loading for 'posts' would be trigger in the following
//    // and result with non-empty posts
//    $this->assertTrue($user->posts===array());
//  }
//
//  public function testTogether()
//  {
//    // test without together
//    $users=UserNoTogether::model()->with('posts.comments')->findAll();
//    $postCount=0;
//    $commentCount=0;
//    foreach($users as $user)
//    {
//      $postCount+=count($user->posts);
//      foreach($posts=$user->posts as $post)
//        $commentCount+=count($post->comments);
//    }
//    $this->assertEquals(4,count($users));
//    $this->assertEquals(5,$postCount);
//    $this->assertEquals(10,$commentCount);
//
//    // test with together
//    $users=UserNoTogether::model()->with('posts.comments')->together()->findAll();
//    $postCount=0;
//    $commentCount=0;
//    foreach($users as $user)
//    {
//      $postCount+=count($user->posts);
//      foreach($posts=$user->posts as $post)
//        $commentCount+=count($post->comments);
//    }
//    $this->assertEquals(3,count($users));
//    $this->assertEquals(4,$postCount);
//    $this->assertEquals(10,$commentCount);
//  }
//
//  public function testTogetherWithOption()
//  {
//    // test with together off option
//    $users=User::model()->with(array(
//      'posts'=>array(
//        'with'=>array(
//          'comments'=>array(
//            'joinType'=>'INNER JOIN',
//            'together'=>false,
//          ),
//        ),
//        'joinType'=>'INNER JOIN',
//        'together'=>false,
//      ),
//    ))->findAll();
//
//    $postCount=0;
//    $commentCount=0;
//    foreach($users as $user)
//    {
//      $postCount+=count($user->posts);
//      foreach($posts=$user->posts as $post)
//        $commentCount+=count($post->comments);
//    }
//    $this->assertEquals(4,count($users));
//    $this->assertEquals(5,$postCount);
//    $this->assertEquals(10,$commentCount);
//
//    // test with together on option
//    $users=User::model()->with(array(
//      'posts'=>array(
//        'with'=>array(
//          'comments'=>array(
//            'joinType'=>'INNER JOIN',
//            'together'=>true,
//          ),
//        ),
//        'joinType'=>'INNER JOIN',
//        'together'=>true,
//      ),
//    ))->findAll();
//
//    $postCount=0;
//    $commentCount=0;
//    foreach($users as $user)
//    {
//      $postCount+=count($user->posts);
//      foreach($posts=$user->posts as $post)
//        $commentCount+=count($post->comments);
//    }
//    $this->assertEquals(3,count($users));
//    $this->assertEquals(4,$postCount);
//    $this->assertEquals(10,$commentCount);
//  }
//
//  public function testCountByAttributes()
//  {
//    $n=Post::model()->countByAttributes(array('author_id'=>2));
//    $this->assertEquals(3,$n);
//
//  }











  }



  function test_eager_relation( topic ) {
    return {
      topic : topic,
      'author' : function( err, post ){
        assert.isNull( err );
        assert.instanceOf( post, Post );
        assert.instanceOf( post.author, User );
        assert.deepEqual( post.author.get_attributes(), {
          id        : 2,
          username  : 'user2',
          password  : 'pass2',
          email     : 'email2'
        } );
      },
      'first comment' : function( err, post ){
        assert.instanceOf( post.first_comment, Comment );
        assert.deepEqual( post.first_comment.get_attributes(), {
          id        : 4,
          content   : 'comment 4',
          post_id   : 2,
          author_id : 2
        } );
      },
      'comments' : function( err, post ){
        assert.lengthOf( post.comments, 2 );
        assert.instanceOf( post.comments[0], Comment );
        assert.deepEqual( post.comments[0].get_attributes(), {
          id        : 5,
          content   : 'comment 5',
          post_id   : 2,
          author_id : 2
        } );
        assert.deepEqual( post.comments[1].get_attributes(), {
          id        : 4,
          content   : 'comment 4',
          post_id   : 2,
          author_id : 2
        } );
      },
      'categories' : function( err, post ){
        assert.lengthOf( post.categories, 2 );
        assert.instanceOf( post.categories[0], Category );
        assert.deepEqual( post.categories[0].get_attributes(), {
          id        : 1,
          name      : 'cat 1',
          parent_id : null
        } );
        assert.deepEqual( post.categories[1].get_attributes(), {
          id        : 4,
          name      : 'cat 4',
          parent_id : 1
        } );
      }
    }
  }
}

