var vows = require('vows'),
    assert = require('assert'),
    autodafe = require('../../framework/autodafe'),
    tools = require('../tools');

vows.describe('logger').addBatch({
    'component': {
        topic: function () {
            return new autodafe.Component({
                app: {},
                name: 'test'
            });
        },
        'should have a log stream': function (component) {
            var logStream = component.getLogStream();
            component.log('some log message');
            assert.equal(logStream.read(), 'some log message\n');
        },
        'application': {
            topic: function () {
                return tools.getApp();
            },
            'should have a log stream too': function (application) {
                var logStream = application.getLogStream();
                logStream.read();
                application.log('some log message for app');
                assert.equal(logStream.read(), 'some log message for app\n');
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
                    assert.equal(message, 'some log message for app\n');
                }
            }
        }
    }
}).export(module);