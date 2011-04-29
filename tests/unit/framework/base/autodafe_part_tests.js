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
    'read value' : function( a_part ){
      assert.equal( a_part.a, 5 );
    },
    'set value' : function( a_part ) {
      assert.throws( function() {
        a_part.a = 8;
      }, TypeError );
    },
    'delete property' : function( a_part ) {
      assert.isFalse( delete a_part.a );
      assert.equal( a_part.a, 5 );
    },
    'reset value' : function( a_part ) {
      assert.throws(function() {
        a_part._.a = 10;
      })

      assert.equal( a_part.a, 5 );
    },
    'read value from _' : function( a_part ){
      assert.equal( a_part._.a, 5 );
    }
  }
}