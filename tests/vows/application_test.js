var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../../framework/autodafe'),
    tools = require('../tools');

vows.describe('Autodafe').addBatch({
    'components': {
        'should be initialized with a name': function () {
            assert.throws(function () {
                new autodafe.Component;
            });
            assert.doesNotThrow(function () {
                new autodafe.Component({name: 'test'});
            });
        },
        'should be able to return their names': function () {
            var component = new autodafe.Component({name: 'test'});
            assert.equal(component.getName(), 'test');
        }
    },
    'application': {
        topic: function () {
            return tools.getApp();
        },
        'should work with components:': {
            topic: function () {
                return new autodafe.Component({name: 'test'});
            },
            'load them': function (component) {
                var application = this.context.topics[1];
                assert.doesNotThrow(function () {
                    application.load(component);
                });
            },
            'throw an error while loading a component with the same name': function (component) {
                var application = this.context.topics[1];
                assert.throws(function () {
                    application.load(component);
                });
            },
            'get the component by a name': function (component) {
                var application = this.context.topics[1];
                assert.equal(application.get('test'), component);
                assert.isNull(application.get('test2'));
            },
            'unload them': function () {
                var application = this.context.topics[1];
                application.unload('test');
                assert.isNull(application.get('test'));
            }
        }
    }
}).export(module);
