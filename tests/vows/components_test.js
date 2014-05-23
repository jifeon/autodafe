var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../../framework/autodafe'),
    Application = require('../../framework/application/Application'),
    Request = require('../../framework/Request'),
    TestRequest = require('../apps/components_test/node_modules/autodafe-test-component/TestRequest');

var t = function (f) {
    var d = require('domain').create();
    d.on('error', function(er) {
      console.error(er);
    });
    d.run(function() {
        f();
        throw new Error;
    });
};

vows.describe('components').addBatch({
    'application': {
        topic: function () {
            return require('../apps/components_test');
        },
        'should be instance of Application class': function (app) {
            assert.instanceOf(app, Application);
        },
        'should load components from config file': {
            topic: function (app) {
                return {
                    test: app.get('test-component'),
                    test2: app.get('test-component2')
                };
            },
            'such as autodafe-test-component': function (tests) {
                assert.instanceOf(tests.test, autodafe.Component);
                assert.equal(tests.test.get(42), 42);
            },
            'by specified path such as test-component2': function (tests) {
                assert.instanceOf(tests.test2, autodafe.Component);
                assert.equal(tests.test2.get(42), 42);
            },
            'and should allow them': {
                topic: function (components, app) {
                    var self = this;
                    components.test.makeRequest();
                    app
                        .on('request:processed', function (request) {
                            self.callback(null, request);
                        })
                        .on('request:failed', function (request, reason) {
                            self.callback(new Error('Request processing failed cause ' + reason));
                        });
                },
                'process requests': function (request) {
                    var components = this.context.topics[1];

                    assert.ok(components.test2.isRequestProcessed());
                    assert.equal(components.test2.getRequest(), request);
                    assert.instanceOf(components.test2.getRequest(), Request);
                    assert.instanceOf(components.test2.getRequest(), TestRequest);
                },
                'process requests in any order, but the component created the request should be last': function (request) {
                    assert.deepEqual(request.order, ['test-component2', 'test-component']);
                }
            }
        }
    }
}).export(module);
