var AtdClass = require('../lib/AtdClass');

var Autodafe = AtdClass.extend({
    _props: function () {
        this._super();

        this.Component = require('./Component');
    },

    _init: function () {
        this._super();


    }
});

module.exports = new Autodafe;