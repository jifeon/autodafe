exports.get_batch = function( application, assert ) {
  var User    = require( 'models/user' );
  var Comment = require( 'models/comment' );

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
          assert.length( comments, 2 );
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
          assert.length( comments, 0 );
        }
      },
      'many_many exist' : {
        topic : function( post ){
          return post.get_related( 'categories' );
        },
        'categories' : function( err, categories ){
          assert.isNull( err );
          assert.length( categories, 2 );
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
          assert.length( categories, 0 );
        }
      }
    }
  }
}




//public function testLazyRelation()
//  {

//
//
//    // test self join
//    $category=Category::model()->findByPk(5);
//    $this->assertEquals(array(),$category->posts);
//    $this->assertEquals(2,count($category->children));
//    $this->assertEquals(array(
//      'id'=>6,
//      'name'=>'cat 6',
//      'parent_id'=>5),$category->children[0]->attributes);
//    $this->assertEquals(array(
//      'id'=>7,
//      'name'=>'cat 7',
//      'parent_id'=>5),$category->children[1]->attributes);
//    $this->assertTrue($category->parent instanceof Category);
//    $this->assertEquals(array(
//      'id'=>1,
//      'name'=>'cat 1',
//      'parent_id'=>null),$category->parent->attributes);
//
//    $category=Category::model()->findByPk(2);
//    $this->assertEquals(1,count($category->posts));
//    $this->assertEquals(array(),$category->children);
//    $this->assertNull($category->parent);
//
//    // test composite key
//    $order=Order::model()->findByPk(array('key1'=>1,'key2'=>2));
//    $this->assertEquals(2,count($order->items));
//    $order=Order::model()->findByPk(array('key1'=>2,'key2'=>1));
//    $this->assertEquals(0,count($order->items));
//    $item=Item::model()->findByPk(4);
//    $this->assertTrue($item->order instanceof Order);
//    $this->assertEquals(array(
//      'key1'=>2,
//      'key2'=>2,
//      'name'=>'order 22'),$item->order->attributes);
//  }
//
//  public function testEagerRelation2()
//  {
//    $post=Post::model()->with('author','firstComment','comments','categories')->findByPk(2);
//  }
//
//  private function checkEagerLoadedModel($post)
//  {
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
//  }
//
//  public function testEagerRelation()
//  {
//    $post=Post::model()->with('author','firstComment','comments','categories')->findByPk(2);
//    $this->checkEagerLoadedModel($post);
//    $post=Post::model()->findByPk(2,array(
//      'with'=>array('author','firstComment','comments','categories'),
//    ));
//    $this->checkEagerLoadedModel($post);
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
//  public function testLazyRecursiveRelation()
//  {
//    $post=PostExt::model()->findByPk(2);
//    $this->assertEquals(2,count($post->comments));
//    $this->assertTrue($post->comments[0]->post instanceof Post);
//    $this->assertTrue($post->comments[1]->post instanceof Post);
//    $this->assertTrue($post->comments[0]->author instanceof User);
//    $this->assertTrue($post->comments[1]->author instanceof User);
//    $this->assertEquals(3,count($post->comments[0]->author->posts));
//    $this->assertEquals(3,count($post->comments[1]->author->posts));
//    $this->assertTrue($post->comments[0]->author->posts[1]->author instanceof User);
//
//    // test self join
//    $category=Category::model()->findByPk(1);
//    $this->assertEquals(2,count($category->nodes));
//    $this->assertTrue($category->nodes[0]->parent instanceof Category);
//    $this->assertTrue($category->nodes[1]->parent instanceof Category);
//    $this->assertEquals(0,count($category->nodes[0]->children));
//    $this->assertEquals(2,count($category->nodes[1]->children));
//  }
//
//  public function testEagerRecursiveRelation()
//  {
//    //$post=Post::model()->with(array('comments'=>'author','categories'))->findByPk(2);
//    $post=Post::model()->with('comments.author','categories')->findByPk(2);
//    $this->assertEquals(2,count($post->comments));
//    $this->assertEquals(2,count($post->categories));
//
//    $posts=PostExt::model()->with('comments')->findAll();
//    $this->assertEquals(5,count($posts));
//  }
//
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
//  public function testRelationalStat()
//  {
//    $users=User::model()->with('postCount')->findAll();
//    $this->assertEquals(4,count($users));
//    $this->assertEquals(1,$users[0]->postCount);
//    $this->assertEquals(3,$users[1]->postCount);
//    $this->assertEquals(1,$users[2]->postCount);
//
//    $users=User::model()->findAll();
//    $this->assertEquals(4,count($users));
//    $this->assertEquals(1,$users[0]->postCount);
//    $this->assertEquals(3,$users[1]->postCount);
//    $this->assertEquals(1,$users[2]->postCount);
//
//    $orders=Order::model()->with('itemCount')->findAll();
//    $this->assertEquals(4,count($orders));
//    $this->assertEquals(2,$orders[0]->itemCount);
//    $this->assertEquals(1,$orders[1]->itemCount);
//    $this->assertEquals(0,$orders[2]->itemCount);
//    $this->assertEquals(2,$orders[3]->itemCount);
//
//    $orders=Order::model()->findAll();
//    $this->assertEquals(4,count($orders));
//    $this->assertEquals(2,$orders[0]->itemCount);
//    $this->assertEquals(1,$orders[1]->itemCount);
//    $this->assertEquals(0,$orders[2]->itemCount);
//    $this->assertEquals(2,$orders[3]->itemCount);
//
//    $categories=Category::model()->with('postCount')->findAll();
//    $this->assertEquals(7,count($categories));
//    $this->assertEquals(3,$categories[0]->postCount);
//    $this->assertEquals(1,$categories[1]->postCount);
//    $this->assertEquals(1,$categories[2]->postCount);
//    $this->assertEquals(1,$categories[3]->postCount);
//    $this->assertEquals(0,$categories[4]->postCount);
//    $this->assertEquals(0,$categories[5]->postCount);
//    $this->assertEquals(0,$categories[6]->postCount);
//
//    $categories=Category::model()->findAll();
//    $this->assertEquals(7,count($categories));
//    $this->assertEquals(3,$categories[0]->postCount);
//    $this->assertEquals(1,$categories[1]->postCount);
//    $this->assertEquals(1,$categories[2]->postCount);
//    $this->assertEquals(1,$categories[3]->postCount);
//    $this->assertEquals(0,$categories[4]->postCount);
//    $this->assertEquals(0,$categories[5]->postCount);
//    $this->assertEquals(0,$categories[6]->postCount);
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