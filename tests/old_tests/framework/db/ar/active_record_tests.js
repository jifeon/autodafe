exports.get_batch = function( application, assert ) {
  var Post            = require('autodafe/tests/test_app/models/post');
  var DbTableSchema   = require('autodafe/framework/db/db_table_schema');
  var DbCriteria      = global.autodafe.db.Criteria;
  var CommandBuilder  = require('autodafe/framework/db/command_builder');
  var MysqlConnection = require('autodafe/framework/db/mysql/mysql_connection');

  var db = new MysqlConnection({
    app       : application,
    user      : application.db.user,
    password  : application.db.password,
    database  : application.db.database,// + '_ar',
    host      : application.db.host
  });


  function query( commands, i, callback ) {
    if ( i >= commands.length ) return callback();

    var command = commands[i].trim();
    if ( !command ) return query( commands, i+1, callback );

    return db.query( command, function( e ) {
      if ( e ) throw e;

      query( commands, i+1, callback );
    });
  }

  return {
    topic : function() {
      var self    = this;
      var tables  = [
        'comments','post_category','posts', 'posts_for_update', 'posts_for_delete',
        'categories','profiles','users',
        'items','orders','types'
      ];

      db.create_command(
        "DROP TABLE IF EXISTS %s CASCADE".format( tables.join(',') )
      ).execute( function( e, result ) {
        if ( e ) throw e;

        application.log( 'Executing mysql.sql', 'trace', 'mysql_tests' );
        application.log_router.get_route( 'console' ).switch_level_off( 'trace' );

        var fs        = require('fs');
        var data      = fs.readFileSync( 'data/mysql.sql', 'utf8' );
        var commands  = data.split(';');

        query( commands, 0, function() {
          application.log_router.get_route( 'console' ).switch_level_on( 'trace' );
          self.callback( null, 1 );
        } );
      } );
    },
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
          return post.table;
        },
        'instance test' : function( table ){
          assert.instanceOf( table, DbTableSchema );
        },
        'primary key' : function( table ){
          assert.equal( table.primary_key, 'id' );
        },
        'in sequence' : function( table ){
          assert.isTrue( table.in_sequence );
        },
        'attributes' : {
          topic : function( table, post ){
            return post.get_attributes();
          },
          'test' : function( attrs ) {
            assert.deepEqual( attrs, {
              id          : null,
              title       : null,
              create_time : null,
              author_id   : null,
              content     : null,
              info        : null
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
      },

      'count' : {
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
        }
      },

      'count_by_sql' : {
        topic : function( post ) {
          return post.count_by_sql( 'select id from posts limit 1' );
        },
        'should return 1' : function( e, count ){
          assert.equal( count, 1 );
        }
      }
    },

    'insert' : {
      topic : new application.models.post_update,
      'check attributes' : function( post ) {
        assert.deepEqual( post.get_attributes(), {
          id          : null,
          title       : null,
          create_time : null,
          author_id   : null,
          content     : null
        } );
      },
      'set attributes one by one' : function( post ){
        post.title        = 'test post 1';
        post.create_time  = new Date;
        post.author_id    = 1;
        post.content      = 'test post content 1';
        post.info         = 'test info 1';

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
              title       : 'test post 1',
              create_time : post.create_time,
              author_id   : 1,
              content     : 'test post content 1',
              info        : 'test info 1'
            } );
            assert.isFalse( post.is_new );
          }
        }
      }
    },

    'update :' : {
      'found record' : {
        topic : function() {
          return application.models.post_update.find_by_pk( 1 );
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
            topic : function( record ) {
              return application.models.post_update.find_by_pk( 1 );
            },
            'with new attributes' : function( err, record ) {
              assert.isNull( err );
              assert.equal( record.title, 'test post 1' );
            }
          }
        }
      }
    },

    'update_by_pk' : {
      topic : function() {
        return application.models.post_update.update_by_pk( [ 4, 5 ], {
          title : 'test post'
        } );
      },
      'should update two record without errors' : function( err, result ){
        assert.isNull( err );
      },
      'should update record with id 4: ' : {
        topic : function() {
          return application.models.post_update.find_by_pk( 4 );
        },
        'check title' : function( err, record ){
          assert.isNull( err );
          assert.equal( record.title, 'test post' );
        }
      },
      'should update record with id 5: ' : {
        topic : function() {
          return application.models.post_update.find_by_pk( 5 );
        },
        'check title' : function( err, record ){
          assert.isNull( err );
          assert.equal( record.title, 'test post' );
        }
      },
      'should not update record with id 2: ' : {
        topic : function() {
          return application.models.post_update.find_by_pk( 2 );
        },
        'check title' : function( err, record ){
          assert.isNull( err );
          assert.equal( record.title, 'post 2' );
        }
      }
    },

    'update_all' : {
      topic : function() {
        return application.models.post_update.update_all( {
          title : 'test post'
        }, 'id=5' );
      },
      'should work without errors' : function( err, result ) {
        assert.isNull( err );
      },
      'should update' : {
        topic : function() {
          return application.models.post_update.find_by_pk( 5 );
        },
        'record with id 5' : function( err, record ){
          assert.equal( record.title, 'test post' );
        }
      }
    },

    'update_counters : ' : {
      topic : function() {
        var counts  = {};
        var self    = this;

        var get_listener = function( post_id ) {
          return function( record ) {
            counts[ post_id ] = record.author_id;

            if ( Object.keys( counts ).length == 3 ) self.callback( null, counts );
          }
        }

        application.models.post_update.find_by_pk( 2 ).on( 'success', get_listener( 2 ) );
        application.models.post_update.find_by_pk( 3 ).on( 'success', get_listener( 3 ) );
        application.models.post_update.find_by_pk( 4 ).on( 'success', get_listener( 4 ) );
      },
      'check exist counters' : function( counts ){
        assert.deepEqual( counts, {
          2 : 2,
          3 : 2,
          4 : 2
        } );
      },
      'decrease counts by condition' : {
        topic : function() {
          return application.models.post_update.update_counters( {
            author_id : -1
          }, 'id>2' );
        },
        'should change author_id' : {
          topic : function() {
            var counts  = {};
            var self    = this;

            var get_listener = function( post_id ) {
              return function( record ) {
                counts[ post_id ] = record.author_id;

                if ( Object.keys( counts ).length == 2 ) self.callback( null, counts );
              }
            }

            application.models.post_update.find_by_pk( 2 ).on( 'success', get_listener( 2 ) );
            application.models.post_update.find_by_pk( 3 ).on( 'success', get_listener( 3 ) );
          },
          'of some records' : function( counts ){
            assert.deepEqual( counts, {
              2 : 2,
              3 : 1
            } );
          }
        }
      }
    },

    'test delete :' : {
      'removed single record' : {
        topic : function() {
          var self = this;

          application.models.post_delete.find_by_pk( 1 ).on( 'success', function( record ) {
            if ( !record ) return self.callback( null, 1 );

            record.remove().on( 'success', function() {
              application.models.post_delete.find_by_pk( 1 ).on( 'success', function( record ) {
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
          topic : function() {
            return application.models.post_delete.find_all_by_pk( [ 2, 3 ] );
          },
          'with id 2 and 3' : function( records ){
            assert.lengthOf( records, 2 );
          },
          'and we can delete them too' : {
            topic : function() {
              var self = this;

              application.models.post_delete.remove_by_pk( [ 2, 3 ] ).on( 'success', function() {
                application.models.post_delete.find_all_by_pk( [ 2, 3 ] ).on( 'success', function( records ) {
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
      }
    },

    'remove all' : {
      topic : function() {
        var self = this;
        application.models.post_delete.remove_all( 'id=5' ).on( 'success', function() {
          application.models.post_delete.find_by_pk( 5 ).on( 'success', function( records ) {
            self.callback( null, records );
          } );
        } );
      },
      'should delete last record' : function( err, record ){
        assert.isNull( record );
      }
    },

    'refresh' : {
      topic : function() {
        var actions = 0;
        var records = {};
        var self    = this;

        var get_listener = function( n, change_info ) {
          return function( record ) {
            if ( change_info ) {
              record.info = 'new info';
              record.save().on( 'success', function() {
                if ( ++actions == 3 ) self.callback( null, records );
              } );
            }

            records[ n ] = record;
            if ( ++actions == 3 ) self.callback( null, records );
          }
        }

        application.models.post.find_by_pk( 1 ).on( 'success', get_listener( 1, false ) );
        application.models.post.find_by_pk( 1 ).on( 'success', get_listener( 2, true ) );
      },
      'before refresh' : function( err, records ){
        assert.equal( records[ 1 ].info, 'info 1' );
      },
      'after_refresh' : {
        topic : function( records ) {
          var self = this;

          records[ 1 ].refresh().on( 'success', function() {
            self.callback( null, records );
          } );
        },
        'attributes should be updated' : function( err, records ){
          assert.equal( records[ 1 ].info, 'new info' );
        }
      }
    },

    'composite key' : {
      topic : function() {
        var order = new application.models.order;
        return order.table;
      },
      'primary key' : function( table ){
        assert.deepEqual( table.primary_key, [ 'key1', 'key2' ] );
      },
      'find_by_pk' : {
        topic : function() {
          return application.models.order.find_by_pk({
            key1 : 2,
            key2 : 1
          });
        },
        'result' : function( err, record ) {
          assert.isNull( err );
          assert.equal( record.name, 'order 21' );
        }
      },
      'find_all_by_pk' : {
        topic : function() {
          return application.models.order.find_all_by_pk([
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
        topic : function() {
          var post = new application.models.post_ext;
          var self = this;
          return post.get_attributes();
        },
        'post' : function( attributes ){
          assert.deepEqual( attributes, {
            id          : null,
            title       : 'default title',
            create_time : null,
            author_id   : null,
            content     : null,
            info        : null
          } );
        }
      },
      'in exist' : {
        topic : function() {
          var self = this;

          application.models.post_ext.find_by_pk( 1 ).on( 'success', function( post ) {
            self.callback( null, post.get_attributes() );
          } );
        },
        'post' : function( e, attributes ){
          assert.isNull( e );
          assert.deepEqual( attributes, {
            id          : 1,
            title       : 'post 1',
            create_time : new Date( 'Sat, 01 Jan 2000 00:00:00 GMT' ),
            author_id   : 1,
            content     : 'content 1',
            info        : 'info 1'
          } );
        }
      },
      'in new' : {
        topic : function() {
          var self = this;
          var post = new application.models.post_ext;

          post.title        = "test post";
          post.create_time  = 1000000;
          post.author_id    = 1;
          post.content      = 'test';
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
            author_id   : 1,
            content     : 'test'
          } );
        }
      }
    },

    'count by attributes' : {
      topic : function() {
        return application.models.post.count_by_attributes( {
          info : 'info 4'
        } );
      },
      'should return 2' : function( err, count ){
        assert.isNull( err );
        assert.equal( count, 2 );
      }
    },

    'exists' : {
      'with id 1' : {
        topic : function() {
          return application.models.post.exists( 'id=:id', {
            id : 1
          } );
        },
        'should exist' : function( err, exist ){
          assert.isNull( err );
          assert.isTrue( exist );
        }
      },
      'with id 8' : {
        topic : function() {
          return application.models.post.exists( 'id=:id', {
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
}



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
