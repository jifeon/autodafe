var vows = require('autodafe/node_modules/vows');
var assert = require('assert');
var tools = require('autodafe/framework/lib/tools');

vows.describe('tools').addBatch({
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


