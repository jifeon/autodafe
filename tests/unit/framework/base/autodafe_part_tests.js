exports.get_batch = function( application, assert ) {
  var AutodafePart = require('autodafe_part');

  return {
    topic : function() {
      var a_part = new AutodafePart;
      a_part._.a = 5;
      return a_part;
    },
    'delete _' : function( a_part ){
      assert.isFalse( delete a_part._ );
    },
    'delete property' : function( a_part ) {
      assert.isFalse( delete a_part.a );
      assert.equal( a_part.a, 5 );
    },
    'read value' : function( a_part ){
      assert.equal( a_part.a, 5 );
    },
    'read value from _' : function( a_part ){
      assert.equal( a_part._.a, 5 );
    },
    'set value' : function( a_part ) {
      assert.throws( function() {
        a_part.a = 8;
      }, TypeError );
    },
    'reset value' : function( a_part ) {
      a_part._.a = 10;
      assert.equal( a_part.a, 10 );
    },
    'set a getter for property' : function( a_part ){
      a_part._.a.get = function() {
        return 100500;
      }

      assert.equal( a_part.a, 100500 );
    },
    'set a setter for property' : function( a_part ){
      var test = 36;

      a_part._.a.set = function( v ) {
        test = v;
        return true;
      }

      a_part.a = 42;

      assert.equal( a_part.a, 100500 );
      assert.equal( test, 42 );
    },
    'set a delete for property' : function( a_part ){

      a_part._.a['delete'] = function() {
        throw new TypeError;
      }

      assert.throws( function() {
        delete a_part.a;
      } );
    },
    'real delete property' : function( a_part ){
      delete a_part._.a;
      
      assert.isUndefined( a_part.a );
    }
  }
}