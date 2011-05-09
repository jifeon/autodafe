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
    'read value from _.value' : function( a_part ){
      assert.equal( a_part._.a.value, 5 );
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
    'reset value to undefined' : function( a_part ){
      a_part._.a = undefined;
      assert.isUndefined( a_part.a );
    },
    'set a getter for property which is undefined' : function( a_part ){
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
    'real delete property' : function( a_part ){
      delete a_part._.a;
      
      assert.isUndefined( a_part.a );

      a_part.a = 86;
      assert.equal( a_part.a, 86 );
    },
    'define property by setting getter' : function( a_part ){
      a_part._.b.get = function() {
        return 555;
      };

      assert.equal( a_part.b, 555 );
    },
    'class_name' : function( a_part ){
      assert.equal( a_part.class_name, 'AutodafePart' );
    }
  }
}