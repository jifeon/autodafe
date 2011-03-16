exports.add_tests_to = function( suite ) {
  var assert = require('assert');

  suite.addBatch({
    'tools tests' : {
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
          p6 : 'just string'
        },
        'Object merge' : {
        }
      }
    }
  });
}
