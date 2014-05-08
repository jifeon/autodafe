module.exports = require("../../../").config({
    basePath: __dirname,
    silent: true,

    components: {
        'test-component': true,
        'test-component2': {
            path: 'node_modules/test-component2'
        }
    }
});