exports.get_batch = function( application, assert ) {

  var DbSchema        = require('db/db_schema');
  var DbTableSchema   = require('db/db_table_schema');
  var DbColumnSchema  = require('db/db_column_schema');
  var DbCriteria      = require('db/db_criteria');
  var CommandBuilder  = require('db/command_builder');

  function query( commands, i, callback ) {
    if ( i >= commands.length ) return callback();

    var command = commands[i].trim();
    if ( !command ) return query( commands, i+1, callback );

    return application.db.query( command, function( e ) {
      if ( e ) throw e;

      query( commands, i+1, callback );
    });
  }
  
  
  function check_columns( values ) {
    return function( e, table ) {
      for ( var property in values ) {
        table.get_column_names().forEach( function( name, i ) {
          var column = table.get_column( name );
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

  var emitter = new process.EventEmitter;

  return {
    topic : function() {
      var self    = this;
      var tables  = [
        'comments','post_category','posts',
        'categories','profiles','users',
        'items','orders','types'
      ];

      application.db.create_command(
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
          self.callback( null, application.db.db_schema );
        } );
      } );
    },
    'db schema' : {
      topic : function( schema ) {
        return schema;
      },
      'schema should be instance of DbSchema' : function( schema ){
        assert.instanceOf( schema, DbSchema );
      },
      'db connection' : function( schema ){
        assert.equal( schema.db_connection, application.db );
      },
      'command builder' : function( schema ) {
        assert.instanceOf( schema.command_builder, CommandBuilder );
      },
      'quote table name' : function( schema ){
        assert.equal( schema.quote_table_name( 'posts' ), '`posts`' );
      },
      'quote column name' : function( schema ){
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
        'columns count is 5' : function( e, table ){
          assert.equal( table.get_column_names().length, 5 );
        },
        'get existed column' : function( e, table ){
          assert.instanceOf( table.get_column( 'id' ), DbColumnSchema );
        },
        'get not existed column' : function( e, table ){
          assert.isNull( table.get_column( 'foo' ) );
        },
        'column names' : function( e, table ){
          assert.deepEqual( table.get_column_names(), ['id','title','create_time','author_id','content'] );
        },
        'columns should contain follow properties' : check_columns({
          'name'          : [ 'id',       'title',        'create_time',    'author_id',    'content'   ],
          'raw_name'      : [ '`id`',     '`title`',      '`create_time`',  '`author_id`',  '`content`' ],
          'default_value' : [ null,       null,           null,             null,           null        ],
          'size'          : [ 11,         128,            null,             11,             null        ],
          'precision'     : [ 11,         128,            null,             11,             null        ],
          'scale'         : [ null,       null,           null,             null,           null        ],
          'db_type'       : [ 'int(11)',  'varchar(128)', 'timestamp',      'int(11)',      'text'      ],
          'type'          : [ 'integer',  'string',       'string',         'integer',      'string'    ],
          'is_primary_key': [ true,       false,          false,            false,          false       ]
        }),

        'command builder' : {
          topic : function( table, db_schema ) {
            return db_schema.command_builder;
          },
          'creating insert command' : {
            topic : function( builder, table ) {

              return builder.create_insert_command( table, {
                title       : 'test post',
                create_time : '2000-01-01',
                author_id   : 1,
                content     : 'test content'
              });
            },
            'test text of command' : function( command ){
              assert.equal(
                command.get_text( true ),
                'INSERT INTO `posts` (`title`, `create_time`, `author_id`, `content`) VALUES (:ap0, :ap1, :ap2, :ap3)'
              );
            },
            'execute' : {
              topic : function( command ) {
                command.execute( this.callback );
              },
              'should insert 6th row' : function( e, result ) {
                assert.isNull( e );
                assert.equal( result.insert_id, 6 );
                emitter.emit( 'count' );
              }
            }
          },
          'creating count command' : {
            topic : function( builder, table ) {
              var self = this;
              emitter.once( 'count', function() {
                self.callback( null, builder.create_count_command( table, new DbCriteria ) );
              } );
            },
            'test text of command' : function( e, command ){
              assert.equal(
                command.get_text( true ),
                'SELECT COUNT(*) FROM `posts` AS `t`'
              );
            },
            'execute' : {
              topic : function( command ) {
                command.query_scalar( this.callback );
              },
              'should be 6' : function( e, result ) {
                assert.isNull( e );
                assert.equal( result, 6 );
                emitter.emit( 'delete' );
              }
            }
          },
          'creating delete command' : {
            topic : function( builder, table ) {
              var self = this;
              emitter.once( 'delete', function() {
                self.callback( null, builder.create_delete_command( table, new DbCriteria({
                  condition : 'id=:id',
                  params    : { id : 6 }
                }) ) );
              } );
            },
            'test text of command' : function( command ){
              assert.equal(
                command.get_text( true ),
                'DELETE FROM `posts` WHERE id=:id'
              );
            },
            'execute' : {
              topic : function( command, builder, table ) {
                var self = this;

                command.execute( function( e ) {
                  if ( e ) throw e;

                  builder.create_count_command( table, new DbCriteria ).query_scalar( self.callback );
                } );
              },
              'count should be 5' : function( e, result ) {
                assert.isNull( e );
                assert.equal( result, 5 );
                emitter.emit( 'find' );
              }
            }
          },
          'creating find command' : {
            topic : function( builder, table ) {
              var self = this;
              emitter.once( 'find', function() {
                self.callback( null, builder.create_find_command( table, new DbCriteria({
                  select      : 'id, title',
                  condition   : 'id=:id',
                  params      : { id : 5 },
                  order       : 'title',
                  limit       : 2,
                  offset      : 0
                }) ) );
              } );
            },
            'test text of command' : function( command ){
              assert.equal(
                command.get_text( true ),
                'SELECT id, title FROM `posts` AS `t` WHERE id=:id ORDER BY title LIMIT 2'
              );
            },
            'execute' : {
              topic : function( command ) {
                command.execute( this.callback );
              },
              'should be 1 row' : function( e, result ) {
                assert.isNull( e );

                var rows = result.get_all_rows();

                assert.length( rows, 1 );
                assert.equal( rows[0][ 'title' ], 'post 5' );
                emitter.emit( 'update' );
              }
            }
          },
          'creating update command' : {
            topic : function( builder, table ) {
              var self = this;
              emitter.once( 'update', function() {
                builder.create_update_command(
                  table,
                  {
                    title : 'new post 5'
                  },
                  new DbCriteria({
                    condition : 'id=:id',
                    params    : { id : 5 }
                  })
                ).execute( function( e ) {
                  if ( e ) throw e;

                  builder.create_find_command( table, new DbCriteria({
                    select    : 'title',
                    condition : 'id=:id',
                    params    : { id : 5 }
                  }) ).query_scalar( self.callback );
                });
              } );
            },
            'execute' : function( e, result ) {
              assert.isNull( e );
              assert.equal( result, 'new post 5' );
              emitter.emit( 'sql' );
            }
          },
          'creating sql command' : {
            topic : function( builder, table ) {
              var self = this;
              emitter.once( 'sql', function() {
                builder.create_sql_command(
                  'SELECT title FROM posts WHERE id=:id',
                  {
                    id : 3
                  }
                ).query_scalar( self.callback );
              });
            },
            'execute' : function( e, result ) {
              assert.isNull( e );
              assert.equal( result, 'post 3' );
              emitter.emit( 'counter' );
            }
          },

          'creating counter command' : {
            topic : function( builder, table ) {
              var self = this;
              emitter.once( 'counter', function() {
                self.callback( null, builder.create_update_counter_command(
                  table,
                  { author_id : -2 },
                  new DbCriteria({
                    condition   : 'id=:id',
                    params      : { id : 5 }
                  })
                ));
              } );
            },
            'test text of command' : function( command ){
              assert.equal(
                command.get_text(),
                'UPDATE `posts` SET `author_id`=`author_id`-2 WHERE id=5'
              );
            },
            'execute' : {
              topic : function( command, builder ) {
                var self = this;
                command.execute( function( e ) {
                  if ( e ) throw e;

                  builder.create_sql_command( 'SELECT author_id FROM posts WHERE id=5' ).query_scalar( self.callback );
                } );
              },
              'should be 1 row' : function( e, result ) {
                assert.isNull( e );
                assert.equal( result, 1 );
//                emitter.emit( 'update' );
              }
            }
          },

          'test creating criteria' : {
            'single pk' : {
              topic : function( builder, table ) {
                return builder.create_pk_criteria( table, 1, 'author_id>1' );
              },
              'criteria condition' : function( criteria ) {
                assert.equal( criteria.condition, '`posts`.`id`=1 AND (author_id>1)' );
              }
            },
            'multi pks' : {
              topic : function( builder, table ) {
                return builder.create_pk_criteria( table, [ 1, 2 ] );
              },
              'criteria condition' : function( criteria ) {
                assert.equal( criteria.condition, '`posts`.`id` IN (1, 2)' );
              }
            },
            'empty pks' : {
              topic : function( builder, table ) {
                return builder.create_pk_criteria( table, [] );
              },
              'criteria condition' : function( criteria ) {
                assert.equal( criteria.condition, '0=1' );
              }
            },
            'column criteria' : {
              topic : function( builder, table ) {
                return builder.create_column_criteria( table, {
                  id        : 1,
                  author_id : 2
                }, 'title=``' );
              },
              'criteria condition' : function( criteria ) {
                assert.equal( criteria.condition, '`posts`.`id`=:ap0 AND `posts`.`author_id`=:ap1 AND (title=``)' );
              }
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
              return builder.create_pk_criteria( table, {
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
              return builder.create_pk_criteria( table, [
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
              return builder.create_pk_criteria( table, {} );
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
      }

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
}