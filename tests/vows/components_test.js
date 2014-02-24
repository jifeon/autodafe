var vows = require('vows'),
    assert = require('assert');

vows.describe('components').addBatch({
    'should be able to be loaded by configuring application': function () {
        var app, test;
        assert.doesNotThrow(function () {
            app = require('../apps/components_test');
        });
        assert.ok(app);
        assert.ok(test = app.get('test-component'));
        assert.equals(test.get(42), 42);
    }
}).export(module);