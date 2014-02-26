var AtdClass = require('../../lib/AtdClass'),
    ApplicationLogStream = require('./ApplicationLogStream');

/**
 * @class Application
 * @extends AtdClass
 * @param {object} [options]
 * @param {object} [options.component] keys - names of components, values - configs for components
 * @param {object} [options.baseUrl] location of application, using for components loading
 */
var Application = module.exports = AtdClass.extend(/**@lends Application*/{
    /**
     * @protected
     */
    _props: function () {
        this._super();

        /**
         * Loaded components
         * @type {Object.<string, Component>}
         * @private
         */
        this._components = {};

        /**
         * @type {string}
         * @private
         */
        this._baseUrl = this._options.baseUrl;

        this._logStream = new ApplicationLogStream;
    },

    _init: function () {
        this._super();

        this._loadComponents(this._options.components);
    },

    _loadComponents: function (components) {
        for (var componentName in components) {
            if (!components.hasOwnProperty(componentName)) {
                continue;
            }

            var Component = require('autodafe-' + componentName);
            this.load(new Component(components[componentName]));
        }
    },

    /**
     * Loads a component for the application
     * @public
     * @param {Component} component
     */
    load: function (component) {
        var componentName = component.getName();
        this.log('Loading a component:', componentName, 'debug');

        if (this._components[componentName]) {
            throw new Error('Try to load more than one component with the same name');
        }

        this._components[componentName] = component;

        component.getLogStream().pipe(this._logStream);
    },

    /**
     * Removes component with specified name from the application
     * @param {string} componentName
     */
    unload: function (componentName) {
        this.log('Unloading a component:', componentName, 'debug');
        var component = this._components[componentName];
        if (component) {
            component.getLogStream().unpipe(this._logStream);
            delete this._components[componentName];
        }
        else {
            this.log('Trying to unload not loaded component', componentName, 'notice');
        }
    },

    /**
     * Return an application component by the name
     * @param {string} componentName
     * @returns {Component|null}
     */
    get: function (componentName) {
        return this._components[componentName] || null;
    },

    getLogStream: function () {
        return this._logStream;
    },

    /**
     *
     * @param {string...} message
     * @param {string} [type="debug"] message level. Can be
     * <ul>
     *  <li>'emergency' - system unusable</li>
     *  <li>'alert' - immediate action required</li>
     *  <li>'critical' - condition critical</li>
     *  <li>'error' - condition error</li>
     *  <li>'warning' - condition warning</li>
     *  <li>'notice' - condition normal, but significant</li>
     *  <li>'info' - a purely informational message</li>
     *  <li>'debug' - debugging information</li>
     * </ul>
     */
    log: function (message, type) {
        this._logStream.write(message);
    }
});

