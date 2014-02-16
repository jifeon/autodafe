var vows = require('vows'),
    assert = require('assert'),
    AtdClass = require('../../lib/AtdClass');

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
        },
        'should provide the _super property, which calls method of parent class': function () {
            var parentMethodInvoked = false,
                childMethodInvoked = false;

            var MyClass = AtdClass.extend({
                m: function () {
                    parentMethodInvoked = true;
                }
            });

            var MyClass2 = MyClass.extend({
                m: function () {
                    this._super();
                    childMethodInvoked = true;
                }
            });

            var myEx = new MyClass2;
            myEx.m();

            assert.isTrue(parentMethodInvoked);
            assert.isTrue(childMethodInvoked);
        },
        'should invoke _prop and _init method while initialization': function () {
            var propsInvoked = false,
                initInvoked = false,
                initInvokedBeforeProp;
            var MyClass = AtdClass.extend({
                _props: function () {
                    this._super();

                    propsInvoked = true;
                    initInvokedBeforeProp = initInvoked;
                },
                _init: function () {
                    this._super();

                    initInvoked = true;
                }
            });
            var myEx = new MyClass;
            assert.isTrue(propsInvoked);
            assert.isTrue(initInvoked);
            assert.isFalse(initInvokedBeforeProp);
        },
        '_init and _props methods should contain a call to _super method': function () {
            assert.throws(function () {
                AtdClass.extend({
                    _init: function () {

                    }
                });
            });
            assert.throws(function () {
                AtdClass.extend({
                    _props: function () {

                    }
                });
            });
        },
        'options passed to constructor should be accessible by `_options` property': function () {
            var options;
            var MyClass = AtdClass.extend({
                _props: function () {
                    this._super();

                    options = this._options;
                }
            });

            new MyClass({
                a: true
            });
            assert.deepEqual(options, {
                a: true
            });

            new MyClass;
            assert.deepEqual(options, {});
        }
    }
}).export(module);