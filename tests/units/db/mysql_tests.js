var vows            = require( 'autodafe/node_modules/vows' );
var assert          = require( 'assert' );
var tests_tools     = require( 'autodafe/tests/tools/tests_tools' );

var DbSchema        = require('autodafe/framework/db/db_schema');
var DbTableSchema   = require('autodafe/framework/db/db_table_schema');
var DbColumnSchema  = require('autodafe/framework/db/db_column_schema');
var DbCriteria      = global.autodafe.db.Criteria;
var CommandBuilder  = require('autodafe/framework/db/command_builder');


function check_columns( values ) {
  return function( e, table ) {
    for ( var property in values ) {
      table.get_column_names().forEach( function( name, i ) {
        var column = table.get_column( name );
        //noinspection JSUnusedGlobalSymbols
        assert.equal(
          column[ property ], values[ property ][ i ],
          'table.column.name is value_, different from expected exp_value'.format( {
            table     : table.name,
            column    : name,
            name      : property,
            value_    : column[ property ],
            exp_value : values[ property ][ i ]
          } )
        );
      } );
    }
  }
}


function test_command( command, tests ){
  var batch = {
    'DbSchema' : {
      topic : function(){
        var self = this;
        tests_tools.create_normal_application( function( e, app ){
          app.db.db_schema.get_table('posts', self.callback);
        } );
      }
    }
  }

  batch[ 'DbSchema' ][ '.command_builder.' + command ] = tests;
  return batch;
}


vows.describe( 'mysql' )
  .addBatch( tests_tools.prepare_base() )
  .addBatch( tests_tools.prepare_tables(
    'users', 'profiles', 'posts', 'comments', 'categories', 'post_category', 'orders', 'items' ) )
  .addBatch({

  'Application' : {
    topic : function() {
      tests_tools.create_normal_application( this.callback );
    },

    '.db.db_schema' : {
      topic : function( app ) {
        return app.db.db_schema;
      },

      'should be instance of DbSchema' : function( schema ){
        assert.instanceOf( schema, DbSchema );
      },

      '.db_connection' : function( schema ){
        var app = this.context.topics[1];
        assert.equal( schema.db_connection, app.db );
      },

      '.command_builder' : function( schema ) {
        assert.instanceOf( schema.command_builder, CommandBuilder );
      },

      '.quote_table_name()' : function( schema ){
        assert.equal( schema.quote_table_name( 'posts' ), '`posts`' );
      },

      '.quote_column_name()' : function( schema ){
        assert.equal( schema.quote_column_name( 'id' ), '`id`' );
      },

      'get not existed table' : {
        topic : function( schema ) {
          schema.get_table( 'foo', this.callback );
        },

        'should not return table schema' : function( e, table ){
          assert.instanceOf( e, Error );
        }
      },

      'table `posts`' : {
        topic : function( schema ) {
          schema.get_table( 'posts', this.callback );
        },

        'should return table schema' : function( e, table ){
          assert.isNull( e );
          assert.instanceOf( table, DbTableSchema );
        },

        'name' : function( e, table ){
          assert.equal( table.name, 'posts' );
        },

        'raw_name' : function( e, table ){
          assert.equal( table.raw_name, '`posts`' );
        },

        'primary_key' : function( e, table ){
          assert.equal( table.primary_key, 'id' );
        },

        'in_sequence' : function( e, table ){
          assert.isTrue( table.in_sequence );
        },

        'columns count is 4' : function( e, table ){
          assert.equal( table.get_column_names().length, 4 );
        },

        'get existed column' : function( e, table ){
          assert.instanceOf( table.get_column( 'id' ), DbColumnSchema );
        },

        'get not existed column' : function( e, table ){
          assert.isNull( table.get_column( 'foo' ) );
        },

        'column names' : function( e, table ){
          assert.deepEqual( table.get_column_names(), ['id','title','create_time','author_id'] );
        },

        'columns should contain follow properties' : check_columns({
          'name'          : [ 'id',       'title',        'create_time',    'author_id'    ],
          'raw_name'      : [ '`id`',     '`title`',      '`create_time`',  '`author_id`'  ],
          'default_value' : [ null,       null,           null,             null           ],
          'size'          : [ 11,         128,            null,             11             ],
          'precision'     : [ 11,         128,            null,             11             ],
          'scale'         : [ null,       null,           null,             null           ],
          'db_type'       : [ 'int(11)',  'varchar(128)', 'timestamp',      'int(11)'      ],
          'type'          : [ 'integer',  'string',       'string',         'integer'      ],
          'is_primary_key': [ true,       false,          false,            false          ]
        }),

        'test creating criteria' : {
          topic : function( table, schema ){
            return schema.command_builder;
          },

          'single pk' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_pk_criteria( table, 1, 'author_id>1' );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '`posts`.`id`=1 AND (author_id>1)' );
            }
          },
          'multi pks' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_pk_criteria( table, [ 1, 2 ] );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '`posts`.`id` IN (1, 2)' );
            }
          },
          'empty pks' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_pk_criteria( table, [] );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '0=1' );
            }
          },
          'column criteria' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_column_criteria( table, {
                id        : 1,
                author_id : 2
              }, 'title=``' );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '`posts`.`id`=:ap0 AND `posts`.`author_id`=:ap1 AND (title=``)' );
            }
          }
        }
      },

      'table `orders`' : {
        topic : function( schema ) {
          schema.get_table( 'orders', this.callback );
        },

        'should be an array' : function( e, table ){
          assert.deepEqual( table.primary_key, [ 'key1','key2' ] );
        },

        'test creating pk criteria' : {
          topic : function( table, schema ) {
            return schema.command_builder;
          },
          'simple composite pk' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_pk_criteria( table, {
                key1 : 1,
                key2 : 2
              }, 'name=``' );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '`orders`.`key1`=1 AND `orders`.`key2`=2 AND (name=``)' );
            }
          },
          'multi composite pk' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_pk_criteria( table, [
                {
                  key1 : 1,
                  key2 : 2
                }, {
                  key1 : 3,
                  key2 : 4
                }
              ] );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '(`orders`.`key1`, `orders`.`key2`) IN ((1, 2), (3, 4))' );
            }
          },
          'empty pks' : {
            topic : function( builder, table ) {
              return table.db_schema.command_builder.create_pk_criteria( table, {} );
            },
            'criteria condition' : function( criteria ) {
              assert.equal( criteria.condition, '0=1' );
            }
          }
        }
      },

      'table `items`' : {
        topic : function( schema ) {
          schema.get_table( 'items', this.callback );
        },
        'primary key' : function( e, table ){
          assert.equal( table.primary_key, 'id' );
        }
      },

      'table `types`' : {
        topic : function( schema ) {
          schema.get_table( 'types', this.callback );
        },
        'should be instance of DbTableSchema' : function( e, table ){
          assert.instanceOf( table, DbTableSchema );
        },
        'name' : function( e, table ){
          assert.equal( table.name, 'types' );
        },
        'raw_name' : function( e, table ){
          assert.equal( table.raw_name, '`types`' );
        },
        'primary key' : function( e, table ){
          assert.isNull( table.primary_key );
        },
        'in_sequence' : function( e, table ) {
          assert.isFalse( table.in_sequence );
        },
        'columns should contain follow properties' : check_columns({
          'name'          : [ 'int_col', 'int_col2', 'char_col', 'char_col2', 'char_col3', 'float_col', 'float_col2', 'blob_col', 'numeric_col', 'time', 'bool_col', 'bool_col2'   ],
          'raw_name'      : [ '`int_col`', '`int_col2`', '`char_col`', '`char_col2`', '`char_col3`', '`float_col`', '`float_col2`', '`blob_col`', '`numeric_col`', '`time`', '`bool_col`', '`bool_col2`' ],
          'default_value' : [ null, 1, null, 'something', null, null, '1.23', null, '33.22', '2002-01-01 00:00:00', null, 1 ],
          'size'          : [ 11, 11, 100, 100, null, 4, null, null, 5, null, 1, 1 ],
          'precision'     : [ 11, 11, 100, 100, null, 4, null, null, 5, null, 1, 1 ],
          'scale'         : [ null, null, null, null, null, 3, null, null, 2, null, null, null ],
          'db_type'       : [ 'int(11)','int(11)','char(100)','varchar(100)','text','double(4,3)','double','blob','decimal(5,2)','timestamp','tinyint(1)','tinyint(1)' ],
          'type'          : [ 'integer','integer','string','string','string','double','double','string','string','string','integer','integer' ],
          'is_primary_key': [ false,false,false,false,false,false,false,false,false,false,false,false ]
        })
      },

      'test create criteria' : {
        topic : function( schema ) {
          return schema.command_builder;
        },
        'init from condition and params' : {
          topic : function( builder ){
            return builder.create_criteria( 'column=:value', { value : 'value' } );
          },
          'check criteria params' : function( criteria ){
            assert.equal( criteria.condition, 'column=:value' );
            assert.deepEqual( criteria.params, { value : 'value' } );
          }
        },
        'init from object' : {
          topic : function( builder ){
            return builder.create_criteria( {
              condition : 'column=:value',
              params    : { value : 'value' }
            });
          },
          'check criteria params' : function( criteria ){
            assert.equal( criteria.condition, 'column=:value' );
            assert.deepEqual( criteria.params, { value : 'value' } );
          },
          'init from criteria' : {
            topic : function( criteria, builder ){
              return [ builder.create_criteria( criteria ), criteria ];
            },
            'check criteria params' : function( criterias ){
              assert.notEqual( criterias[0], criterias[1] );
              assert.equal( criterias[0].condition, 'column=:value' );
              assert.deepEqual( criterias[0].params, { value : 'value' } );
            }
          }
        }

      }
    }
  }})
  
  .addBatch( test_command( 'create_insert_command', {
    topic : function( table ){
      return table.db_schema.command_builder.create_insert_command( table, {
        title       : 'test post',
        create_time : '2000-01-01',
        author_id   : 1
      });
    },

    '.get_text()' : function( command ){
      assert.equal(
        command.get_text( true ),
        'INSERT INTO `posts` (`title`, `create_time`, `author_id`) VALUES (:ap0, :ap1, :ap2)'
      );
    },

    '.execute()' : {
      topic : function( command ) {
        command.execute( this.callback );
      },
      'should insert 6th row' : function( e, result ) {
        assert.isNull( e );
        assert.equal( result.insert_id, 6 );
      }
    }
  }))
  
  .addBatch( test_command( 'create_count_command', {
    topic : function( table ) {
      return table.db_schema.command_builder.create_count_command( table, new DbCriteria );
    },

    '.get_text()' : function( e, command ){
      assert.equal(
        command.get_text( true ),
        'SELECT COUNT(*) FROM `posts` AS `t`'
      );
    },

    '.execute()' : {
      topic : function( command ) {
        command.query_scalar( this.callback );
      },

      'should be 6' : function( e, result ) {
        assert.isNull( e );
        assert.equal( result, 6 );
      }
    }
  }))

  .addBatch( test_command( 'create_delete_command', {
    topic : function( table ) {
      return table.db_schema.command_builder.create_delete_command( table, new DbCriteria({
        condition : 'id=:id',
        params    : { id : 6 }
      }) )
    },
    '.get_text()' : function( command ){
      assert.equal(
        command.get_text( true ),
        'DELETE FROM `posts` WHERE id=:id'
      );
    },
    '.execute()' : {
      topic : function( command, table ) {
        var self = this;

        command.execute( function( e ) {
          if ( e ) throw e;

          table.db_schema.command_builder.create_count_command( table, new DbCriteria ).query_scalar( self.callback );
        } );
      },
      'count should be 5' : function( e, result ) {
        assert.isNull( e );
        assert.equal( result, 5 );
      }
    }
  }))

  .addBatch( test_command( 'create_find_command', {
    topic : function( table ) {
      return table.db_schema.command_builder.create_find_command( table, new DbCriteria({
        select      : 'id, title',
        condition   : 'id=:id',
        params      : { id : 5 },
        order       : 'title',
        limit       : 2,
        offset      : 0
      }) );
    },
    '.get_text()' : function( command ){
      assert.equal(
        command.get_text( true ),
        'SELECT id, title FROM `posts` AS `t` WHERE id=:id ORDER BY title LIMIT 2'
      );
    },
    '.execute()' : {
      topic : function( command ) {
        command.execute( this.callback );
      },
      'should be 1 row' : function( e, result ) {
        assert.isNull( e );

        var rows = result.get_all_rows();

        assert.lengthOf( rows, 1 );
        assert.equal( rows[0][ 'title' ], 'post 5' );
      }
    }
  }))

  .addBatch( test_command( 'create_update_command', {
    topic : function( table ) {
      var self = this;
      table.db_schema.command_builder.create_update_command(
        table,
        { title : 'new post 5' },
        new DbCriteria({
          condition : 'id=:id',
          params    : { id : 5 }
        })
      ).execute( function( e ) {
        if ( e ) throw e;

        table.db_schema.command_builder.create_find_command( table, new DbCriteria({
          select    : 'title',
          condition : 'id=:id',
          params    : { id : 5 }
        }) ).query_scalar( self.callback );
      });
    },
    '.execute()' : function( e, result ) {
      assert.isNull( e );
      assert.equal( result, 'new post 5' );
    }
  }))

  .addBatch( test_command( 'create_sql_command', {
    topic : function( table ) {
      table.db_schema.command_builder.create_sql_command(
        'SELECT title FROM posts WHERE id=:id',
        { id : 3 }
      ).query_scalar( this.callback );
    },
    '.execute()' : function( e, result ) {
      assert.isNull( e );
      assert.equal( result, 'post 3' );
    }
  }))

  .addBatch( test_command( 'create_update_counter_command', {
    topic : function( table ) {
      return table.db_schema.command_builder.create_update_counter_command(
        table,
        { author_id : -2 },
        new DbCriteria({
          condition   : 'id=:id',
          params      : { id : 5 }
        })
      );
    },
    '.get_text()' : function( command ){
      assert.equal(
        command.get_text(),
        'UPDATE `posts` SET `author_id`=`author_id`-2 WHERE id=5'
      );
    },
    '.execute()' : {
      topic : function( command, table ) {
        var self = this;
        command.execute( function( e ) {
          if ( e ) throw e;

          table.db_schema.command_builder
            .create_sql_command( 'SELECT author_id FROM posts WHERE id=5' )
            .query_scalar( self.callback );
        } );
      },
      'should be 1 row' : function( e, result ) {
        assert.isNull( e );
        assert.equal( result, 1 );
      }
    }
  }))
  .export( module );
