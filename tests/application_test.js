var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../framework/autodafe');

vows.describe('Autodafe').addBatch({
    'components': {
        'should be initialized with a name': function () {
            assert.throws(function () {
                new autodafe.Component;
            });
            assert.doesNotThrow(function () {
                new autodafe.Component({name: 'test'});
            });
        }
    },
    'application': {
        topic: function () {
            return autodafe.createApplication();
        },
        'should work with components:': {
            topic: function () {
                var component = new autodafe.Component({name: 'test'});
                return component;
            },
            'load them': function (component, application) {
                assert.doesNotThrow(function () {
                    application.load(component);
                });
            },
            'throw an error while loading a component with the same name': function (component, application) {
                assert.throws(function () {
                    application.load(component);
                });
            },
            'get the component by a name': function (component, application) {
                assert.equal(application.get('test'), component);
                assert.isNull(application.get('test2'));
            },
            'unload them': function (component, application) {
                application.unload('test');
                assert.isNull(application.get('test'));
            }
        }
    }
}).export(module);