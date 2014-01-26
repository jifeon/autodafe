var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../framework/autodafe');

vows.describe('Autodafe').addBatch({
    'application': {
        topic: function () {
            return autodafe.createApplication();
        },
        'should be able to load components': function (topic) {

        }
    }
}).export(module);