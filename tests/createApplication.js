var vows = require('vows'),
    assert = require('assert');

vows.describe('Autodafe').addBatch({
    'test': {
        topic: 42,
        'should be 42': function (topic) {
            assert.equal(topic, 42);
        }
    }
}).export(module);