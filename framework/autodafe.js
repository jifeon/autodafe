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
     * @param {object} [options]
     * @param {boolean} [options.silent] set to true if it's unnecessary to pipe application log to process.stdout
     * @param {object} [options.config] params for {@link Application}
     */
    createApplication: function (options, config) {
        options = options || {};

        var application = new Application(config);
        if (options.silent !== true) {
            application.getLogStream().pipe(process.stdout);
        }
        return application;
    },

    config: function (config) {
        return this.createApplication(null, config);
    }
});

/**
 * @type {Autodafe}
 */
module.exports = new Autodafe;