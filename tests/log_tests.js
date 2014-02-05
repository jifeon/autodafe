var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../framework/autodafe');

vows.describe('logging tests').addBatch({
    'application': {
        topic: function () {
            return autodafe.createApplication();
        },
        'log stream should emit a data event every time when the `log` method is invoked': function (application) {
            var logStream = application.getLogStream(),
                dataEmitted = false;



            application.log('Test message');


        }
    }
}).export(module);