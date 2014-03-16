var autodafe = require('../framework/autodafe'),
    freePort = 3000;

module.exports = {
    getApp: function () {
        return autodafe.createApplication({
            silent: true
        });
    },

    getFreePort: function () {
        return freePort++;
    }
};