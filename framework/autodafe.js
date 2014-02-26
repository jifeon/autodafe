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
     * @param {object} [options] params for {@link Application}
     * @param {boolean} [options.silent] set to true if it's unnecessary to pipe application log to process.stdout
     */
    createApplication: function (options) {
        options = options || {};
        options.baseUrl = options.baseUrl || this._detectBaseUrl();

        var application = new Application(options);
        if (options.silent !== true) {
            application.getLogStream().pipe(process.stdout);
        }
        return application;
    },

    _detectBaseUrl: function () {
        return '';
    },

    config: function (config) {
        return this.createApplication(config);
    }
});

/**
 * @type {Autodafe}
 */
module.exports = new Autodafe;