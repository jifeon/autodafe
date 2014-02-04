var AtdClass = require('../lib/AtdClass');

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
    },

    /**
     * Removes component with specified name from the application
     * @param {string} componentName
     */
    unload: function (componentName) {
        delete this._components[componentName];
    },

    /**
     * Return an application component by the name
     * @param {string} componentName
     * @returns {Component|null}
     */
    get: function (componentName) {
        return this._components[componentName] || null;
    }
});

