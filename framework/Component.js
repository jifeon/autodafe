var AtdClass = require('../lib/AtdClass');

/**
 * @class Component
 * @extends AtdClass
 * @params {object} options
 * @param {string} options.name The name of the component
 * @throws {Error} is the name is not specified
 */
var Component = module.exports = AtdClass.extend(/**@lends Component*/{
    /**
     * @protected
     */
    _props: function () {
        this._super();

        if (this._options.name === undefined) {
            throw new Error('A component should have a name');
        }

        /**
         * @type {string}
         * @private
         */
        this._name = this._options.name;
    },

    /**
     * Returns the component name
     * @public
     * @returns {string}
     */
    getName: function () {
        return this._name;
    }
});

