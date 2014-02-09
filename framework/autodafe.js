var AtdClass = require('../lib/AtdClass'),
    Application = require('./application/Application');

/**
 * @class Autodafe
 * @extends AtdClass
 */
var Autodafe = AtdClass.extend(/**@lends Autodafe*/{
    /**
     * @protected
     */
    _props: function () {
        this._super();

        /**
         * {@link Component} constructor
         * @public
         * @type {Function}
         */
        this.Component = require('./component/Component');
    },

    /**
     * Creates new application
     * @public
     * @returns {Application}
     */
    createApplication: function () {
        return new Application;
    }
});

/**
 * @type {Autodafe}
 */
module.exports = new Autodafe;