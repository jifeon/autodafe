var AtdClass = require('../../lib/AtdClass'),
    _ = require('underscore'),
    ApplicationLogStream = require('./ApplicationLogStream'),
    path = require('path');

/**
 * @class Application
 * @extends AtdClass
 * @param {object} [options]
 * @param {object.<string, boolean|object>} [options.component] components to load while application initialization;
 * keys - names of components, values - configs for components. The components are looking by name inside
 * {@link Application._basePath}/node_modules folder
 * @param {string} [options.basePath] location of application, using for components loading
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
         * The path to the application location
         * @type {string}
         * @private
         */
        this._basePath = this._options.basePath;

        /**
         * @type {ApplicationLogStream}
         * @private
         */
        this._logStream = new ApplicationLogStream;
    },

    /**
     * @constructs
     * @protected
     */
    _init: function () {
        this._super();

        this._loadComponents(this._options.components);
    },

    /**
     * @param {object.<string, boolean|object>} components
     * @see {@link Application} options.components parameter for full description
     * @private
     */
    _loadComponents: function (components) {
        for (var componentName in components) {
            if (!components.hasOwnProperty(componentName)) {
                continue;
            }

            var componentParams = components[componentName];
            if (componentParams === true) {
                componentParams = {};
            }

            if (!_.isObject(componentParams)) {
                continue;
            }

            componentParams.name = componentParams.name || componentName;
            componentParams.app = this;

            var componentPath = path.join(this._basePath, 'node_modules', 'autodafe-' + componentName),
                Component = require(componentPath);

            this.load(new Component(componentParams));
        }
    },

    /**
     * Loads a component for the application
     * @public
     * @param {Component} component
     * @throws {Error} if a component with the same name has been already loaded
     * @returns {Application} this
     */
    load: function (component) {
        var componentName = component.getName();
        this.log('Loading a component:', componentName, 'debug');

        if (this._components[componentName]) {
            throw new Error('Try to load more than one component with the same name');
        }

        this._components[componentName] = component;

        component.getLogStream().pipe(this._logStream);
        return this;
    },

    /**
     * Removes component with specified name from the application
     * @param {string} componentName
     * @returns {Application} this
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
        return this;
    },

    /**
     * Return an application component by the name
     * @param {string} componentName
     * @returns {Component|null}
     */
    get: function (componentName) {
        return this._components[componentName] || null;
    },

    /**
     * Returns applications log stream than can be piped to anywhere you want write log
     * @returns {ApplicationLogStream}
     */
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
    },

    //todo: tests
    /**
     * @public
     * @returns {string}
     * @see {@link Application._basePath}
     */
    getBasePath: function () {
        return this._basePath;
    }
});

