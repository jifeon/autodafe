console.dir(process.argv);
module.exports = require("autodafe").config({
    components: {
        'test-component': true
    }
});