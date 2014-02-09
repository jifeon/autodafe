var AtdClass = require('../../lib/AtdClass'),
    ApplicationLogStream = require('./ApplicationLogStream');

/**
 * @class Application
 * @extends AtdClass
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

        this._logStream = new ApplicationLogStream;
    },

    /**
     * Loads a component for the application
     * @public
     * @param {Component} component
     */
    load: function (component) {
        var componentName = component.getName();
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
        var component = this._components[componentName];
        if (component) {
            component.getLogStream().unpipe(this._logStream);
            delete this._components[componentName];
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

    log: function (message, type) {
        this._logStream.write(message);
    }
});

