var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../../framework/autodafe'),
    Application = require('../../framework/application/Application');

vows.describe('components').addBatch({
    'should be able to be loaded by configuring application': function () {
        var app, test;
        assert.doesNotThrow(function () {
            app = require('../apps/components_test');
        });
        assert.instanceOf(app, Application);
        assert.instanceOf(test = app.get('test-component'), autodafe.Component);
        assert.equals(test.get(42), 42);
    }
}).export(module);