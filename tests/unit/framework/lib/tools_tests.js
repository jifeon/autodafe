exports.get_batch = function( application, assert ) {
  return {
    'Array\'s methods' : {
      topic : [ 1,2,3,2 ],
      'Array diff' : {
        'argument to diff is not an array' : function( ar ){
          assert.throws( function() {
            ar.diff(3);
          }, TypeError );
        },
        'normal work' : function( ar ){
          assert.deepEqual( ar.diff( [2]        ), [1,3]  );
          assert.deepEqual( ar.diff( []         ), ar     );
          assert.deepEqual( ar.diff( [4]        ), ar     );
          assert.deepEqual( ar.diff( [1,2]      ), [3]    );
          assert.deepEqual( ar.diff( [1,2,3]    ), []     );
          assert.deepEqual( ar.diff( [4,4,2,2]  ), [1,3]  );
        }
      },
      'Array merge' : {
        'argument to merge is not an array' : function( ar ){
          assert.throws( function() {
            ar.merge(3);
          }, TypeError );
        },
        'normal work' : function( ar ){
          assert.deepEqual( ar.merge( [2]       ), [1,2,3]      );
          assert.deepEqual( ar.merge( [2,3,4]   ), [1,2,3,4]    );
          assert.deepEqual( ar.merge( []        ), [1,2,3]      );
          assert.deepEqual( ar.merge( [5]       ), [1,2,3,5]    );
          assert.deepEqual( ar.merge( [5,7,5,1] ), [1,2,3,5,7]  );
        }
      }
    },
    'Object\'s methods' : {
      topic : {
        p1 : 42,
        p2 : null,
        p3 : undefined,
        p4 : false,
        p5 : true,
        p6 : 'just string',
        p7 : {
          v : 8
        }
      },
      'Object merge' : {
        'bad arguments' : function( obj ){
          assert.throws( function() {
            Object.merge( {}, 'not object' );
          }, TypeError );
          assert.throws( function() {
            Object.merge( [], undefined );
          }, TypeError );
          assert.throws( function() {
            Object.merge( [], [] );
          }, TypeError );
          assert.throws( function() {
            Object.merge( false, {} );
          }, TypeError );
        },
        'normal work' : function( obj ) {
          assert.deepEqual( Object.merge( obj, {
            p1 : false,
            p2 : 12,
            p3 : undefined,
            p7 : {
              v : 7
            }
          } ), {
            p1 : false,
            p2 : 12,
            p3 : undefined,
            p4 : false,
            p5 : true,
            p6 : 'just string',
            p7 : {
              v : 7
            }
          } );
        }
      },
      'Object recursive merge' : {
        topic : {
          p1 : null,
          p2 : undefined,
          p3 : {
            p4 : {
              p8 : 12
            },
            p5 : 6,
            p7 : 42,
            p10 : {}
          }
        },
        'bad arguments' : function( obj ){
          assert.throws( function() {
            Object.recursive_merge( {}, 'not object' );
          }, TypeError );
          assert.throws( function() {
            Object.recursive_merge( [], undefined );
          }, TypeError );
          assert.throws( function() {
            Object.recursive_merge( [], [] );
          }, TypeError );
          assert.throws( function() {
            Object.recursive_merge( false, {} );
          }, TypeError );
        },
        'normal work' : function( obj ){
          assert.deepEqual( Object.recursive_merge( obj, {
            p1 : false,
            p2 : false,
            p3 : {
              p4 : {
                p9 : 9
              },
              p5 : 4,
              p6 : 6,
              p10 : 11
            }
          } ), {
            p1 : false,
            p2 : false,
            p3 : {
              p4 : {
                p9 : 9,
                p8 : 12
              },
              p5 : 4,
              p7 : 42,
              p10 : 11,
              p6 : 6
            }
          });
        }
      },
      'Object empty' : {
        'object' : function(){
          assert.isTrue( Object.empty( {} ) );
          assert.isFalse( Object.empty( { d : 5 } ) );
        },
        'array' : function(){
          assert.isTrue( Object.empty( [] ) );
          assert.isFalse( Object.empty( [ 42 ] ) );
          assert.isFalse( Object.empty( [ undefined ] ) );
          assert.isFalse( Object.empty( [ false ] ) );
        },
        'string' : function() {
          assert.isTrue( Object.empty( '' ) );
          assert.isFalse( Object.empty( 'aa' ) );
          assert.isFalse( Object.empty( '0' ) );
        },
        'other' : function() {
          assert.isTrue( Object.empty( false ) );
          assert.isTrue( Object.empty( null ) );
          assert.isTrue( Object.empty( undefined ) );
          assert.isTrue( Object.empty( 0 ) );
          assert.isFalse( Object.empty( 1 ) );
        }
      },
      'Object clone' : function( obj ) {
        var cloned = Object.clone( obj );

        assert.notEqual( cloned, obj );
        assert.deepEqual( cloned, obj );
      }
    },
    'String\'s methods' : {
      topic : "Hello, %s! %d",
      'String format' : function( str ) {
        assert.equal( str.format( 'World', 11 ), 'Hello, World! 11' );
      }
    },
    'Date\'s methods' : {
      topic : new Date( 2011, 2, 22, 0, 39, 40, 32 ),
      'Date format' : function( date ) {
        assert.equal( date.format( 'Y-M-D h:m:s(x)' ), '2011-03-22 00:39:40(032)' );
      }
    }
  }
}
