var vows = require('vows'),
    assert = require('assert'),
    AtdClass = require('../lib/AtdClass');

vows.describe('library tests').addBatch({
    'AtdClass': {
        'should provide inheritance': function () {
            var MyClass;
            assert.doesNotThrow(function () {
                MyClass = AtdClass.extend({});
            });
            assert.isFunction(MyClass);

            var myEx;
            assert.doesNotThrow(function () {
                myEx = new MyClass;
            });
            assert.instanceOf(myEx, MyClass);
            assert.instanceOf(myEx, AtdClass);

            var MyClass2;
            assert.doesNotThrow(function () {
                MyClass2 = MyClass.extend({});
            });

            var myEx2;
            assert.doesNotThrow(function () {
                myEx2 = new MyClass2;
            });
            assert.instanceOf(myEx2, MyClass2);
            assert.instanceOf(myEx2, MyClass);
            assert.instanceOf(myEx2, AtdClass);
        }
    }
}).export(module);