var AtdClass = require('../lib/AtdClass'),
    Application = require('./application/Application'),
    argv = require('optimist').argv,
    path = require('path');

/**
 * @class Autodafe
 * @extends AtdClass
 */
var Autodafe = AtdClass.extend(/**@lends Autodafe*/{
    /**
     * {@link AtdClass} constructor
     * @public
     * @type {Function}
     */
    AtdClass: AtdClass,

    /**
     * {@link Component} constructor
     * @public
     * @type {Function}
     */
    Component: require('./component/Component'),

    /**
     * @type {function}
     * @see https://github.com/alexei/sprintf.js
     * @public
     */
    sprintf: require('sprintf-js').sprintf,

    /**
     * @type {function}
     * @see http://underscorejs.org
     */
    _: require('underscore'),

    /**
     * Creates new application
     * @public
     * @returns {Application}
     * @param {object} [options] params for {@link Application}
     * @param {boolean} [options.silent] set to true if it's unnecessary to pipe application log to process.stdout
     * @param {string} [options.basePath] path to root folder of application; should be specified if application is not
     * run directly through <code>node path/to/app/index.js</code>, otherwise it will be set as path to folder contained
     * running file.
     * @see {@link Application} for other options
     */
    createApplication: function (options) {
        options = options || {};
        options.basePath = options.basePath || this._detectBasePath();

        var application = new Application(options);
        if (options.silent !== true) {
            application.getLogStream().pipe(process.stdout);
        }
        return application;
    },

    /**
     * Returns the path to folder that contained running file
     * @returns {string}
     * @private
     */
    _detectBasePath: function () {
        var mainPath = argv._[0];
        if (!mainPath) {
            return '';
        }

        var mainFile;
        try {
            mainFile = require.resolve(mainPath);
        }
        catch (e) {
            return '';
        }

        return path.dirname(mainFile);
    },

    /**
     * Now it's just the alias for {@link Autodafe.createApplication} reserved for further features.
     * @param {object} config see options in {@link Autodafe.createApplication}
     * @returns {Application}
     */
    config: function (config) {
        return this.createApplication(config);
    }
});

/**
 * @type {Autodafe}
 */
module.exports = new Autodafe;