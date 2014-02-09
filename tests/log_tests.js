var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../framework/autodafe');

vows.describe('logger').addBatch({
    'component': {
        topic: function () {
            return new autodafe.Component({
                name: 'test'
            });
        },
        'should have a log stream': function (component) {
            var logStream = component.getLogStream();
            component.log('some log message');
            assert.equal(logStream.read(), 'some log message');
        },
        'application': {
            topic: function () {
                return autodafe.createApplication();
            },
            'should have a log stream too': function (application) {
                var logStream = application.getLogStream();
                application.log('some log message for app');
                assert.equal(logStream.read(), 'some log message for app');
            },
            'should proxy log messages from any component': {
                topic: function (application) {
                    var component = this.context.topics[1];
                    application.load(component);
                    component.log('some log message for app');
                    application.getLogStream().on('data', function (message) {
                        this.callback(null, message);
                    }.bind(this));
                },
                'with component name prefix': function (message) {
                    assert.equal(message, 'some log message for app');
                }
            }
        }
    }
}).export(module);