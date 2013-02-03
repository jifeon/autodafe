var vows = require('autodafe/node_modules/vows');
var assert = require('assert');
var tools = require('autodafe/framework/lib/tools');

var simple_obj = {
  p1: 42,
  p2: null,
  p3: undefined,
  p4: false,
  p5: true,
  p6: 'just string',
  p7: {
    v: 8,
    d: 5
  }
};

var complex_obj = {
  p1: null,
  p2: undefined,
  p3: {
    p4 : {
      p8: 12
    },
    p5 : 6,
    p7 : 42,
    p10: {},
    ar : [ 1, {
      p11: 100
    } ]
  }
};

function clone_test(deep) {
  return {

    topic: function () {
      return Object[deep ? 'clone' : 'not_deep_clone'](complex_obj);
    },

    'should copy object': function (cloned) {
      assert.notEqual(cloned, complex_obj);
      assert.deepEqual(cloned, complex_obj);

      cloned.p3.ar[1].p11 = 82;
      assert.equal(complex_obj.p3.ar[1].p11, deep ? 100 : 82);
    }
  }
}


vows.describe('tools').addBatch({
  'Object': {

    '.recursive_merge': {

      topic: complex_obj,

      'should recursive merge properties': function (obj) {
        assert.deepEqual(Object.recursive_merge(obj, {
          p1: false,
          p2: false,
          p3: {
            p4 : {
              p9: 9
            },
            p5 : 4,
            p6 : 6,
            p10: 11
          }
        }), {
          p1: false,
          p2: false,
          p3: {
            p4 : {
              p9: 9,
              p8: 12
            },
            p5 : 4,
            p7 : 42,
            p10: 11,
            ar : [ 1, {
              p11: 100
            } ],
            p6 : 6
          }
        });
      },

      'should not touch original object': function (obj) {
        assert.deepEqual(obj, {
          p1: null,
          p2: undefined,
          p3: {
            p4 : {
              p8: 12
            },
            p5 : 6,
            p7 : 42,
            p10: {},
            ar : [ 1, {
              p11: 100
            } ]
          }
        });
      }
    },

    '.isEmpty': function () {
      assert.isTrue(Object.isEmpty({}));
      assert.isFalse(Object.isEmpty({ d: 5 }));

      assert.isTrue(Object.isEmpty([]));
      assert.isFalse(Object.isEmpty([ 42 ]));
      assert.isFalse(Object.isEmpty([ undefined ]));
      assert.isFalse(Object.isEmpty([ false ]));

      assert.isTrue(Object.isEmpty(''));
      assert.isFalse(Object.isEmpty('aa'));
      assert.isFalse(Object.isEmpty('0'));

      assert.isTrue(Object.isEmpty(false));
      assert.isTrue(Object.isEmpty(null));
      assert.isTrue(Object.isEmpty(undefined));

      assert.isTrue(Object.isEmpty(0));
      assert.isFalse(Object.isEmpty(1));
    },

    '.clone': clone_test(true),

    '.not_deep_clone': clone_test(false)
  },


  'String': {

    '.format inline': {

      topic: "Hello, %s! %d",

      'should replace %s and %d with value': function (str) {
        assert.equal(str.format('World', 11), 'Hello, World! 11');
      }
    },

    '.format with params': {

      topic: "{r1} {r2}! {r2} - {r1}",

      'should replace text from params': function (str) {
        assert.equal(str.format({
          '{r1}': '{r2}',
          '{r2}': '{r1}'
        }), '{r2} {r1}! {r1} - {r2}');
      }
    }
  },


  'Date': {

    topic: new Date(2011, 2, 22, 0, 39, 40, 32),

    '.format': function (date) {
      assert.equal(date.format('Y-M-D h:m:s(x)'), '2011-03-22 00:39:40(032)');
    },

    '.getUTCFormat': function () {
      throw 'no tests';
    }
  },


  'Function': {
    '.inherits': function () {
      throw 'no tests';
    }
  },


  'Number': {
    '.frequency_to_period': function () {
      throw 'no tests';
    }
  },


  'EventEmitter': {
    '.re_emit': function () {
      throw 'no tests';
    }
  },

  'next_tick': function () {
    throw 'no tests';
  },

  'to_object': function () {
    assert.deepEqual(tools.to_object([
      'required',
      { 'a': 42,
        'b': 'some text' }
    ]), {
      required: true,
      a       : 42,
      b       : {
        some: true,
        text: true
      }
    });

    assert.deepEqual(tools.to_object({
      'email': 'user.email',
      'pass' : 'user.pass'
    }), {
      'email': {
        'user.email': true
      },
      'pass' : {
        'user.pass': true
      }
    });
  }

}).export(module);


