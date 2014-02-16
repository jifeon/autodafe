var autodafe = require('../framework/autodafe');

module.exports = {
    getApp: function () {
        return autodafe.createApplication({
            silent: true
        });
    }
};