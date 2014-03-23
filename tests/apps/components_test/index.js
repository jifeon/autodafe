module.exports = require("autodafe").config({
    basePath: __dirname,
    silent: true,

    components: {
        'test-component': true,
        'test-component2': true
    }
});