var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../../framework/autodafe'),
    Application = require('../../framework/application/Application'),
    Request = require('../../framework/Request'),
    TestRequest = require('../apps/components_test/node_modules/autodafe-test-component/TestRequest');

vows.describe('components').addBatch({
    'application': {
        topic: function () {
            return require('../apps/components_test');
        },
        'should be instance of Application class': function (app) {
            assert.instanceOf(app, Application);
        },
        'should be able to load components from config file': {
            topic: function (app) {
                return app.get('test-component');
            },
            'such as test component': function (test) {
                assert.instanceOf(test, autodafe.Component);
                assert.equal(test.get(42), 42);
            }
        },
        'should allow components': {
            topic: function (app) {
                return {
                    test: app.get('test-component'),
                    test2: app.get('test-component2')
                };
            },
            'process requests': function (components) {
                assert.isFalse(components.test2.isRequestProcessed());
                components.test.makeRequest();
                assert.ok(components.test2.isRequestProcessed());
                assert.instanceOf(components.test2.getRequest(), Request);
                assert.instanceOf(components.test2.getRequest(), TestRequest);
            },
            'process requests in any order, but the component created the request should be last': function (components) {
                assert.deepEqual(components.test2.getRequest().order, ['test-component2', 'test-component']);
            },
            'process request async': {
                topic: function (components) {
                    return components.test.makeAsyncRequest();
                },
                'that should not be processed on same tick': function (request) {
                    assert.isFalse(request.processed);
                },
                'that should be processed': {
                    topic: function (request) {
                        setTimeout(this.callback.bind(this, null, request), 30);
                    },
                    'in 30 ms': function (request) {
                        assert.ok(request.processed);
                    }
                }
            }
        }
    }
}).export(module);