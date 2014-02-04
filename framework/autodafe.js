var AtdClass = require('../lib/AtdClass'),
    Application = require('./Application');

/**
 * @class Autodafe
 * @extends AtdClass
 */
var Autodafe = AtdClass.extend(/**@lends Autodafe*/{
    _props: function () {
        this._super();

        /**
         * @public
         * @type {Function}
         */
        this.Component = require('./Component');
    },

    _init: function () {
        this._super();


    },

    createApplication: function () {
        return new Application;
    }
});

/**
 * @type {Autodafe}
 */
module.exports = new Autodafe;