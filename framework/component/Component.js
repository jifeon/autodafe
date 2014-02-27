var AtdClass = require('../../lib/AtdClass'),
    ComponentLogStream = require('./ComponentLogStream');

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
     * @type {string}
     */
    _name: null,

    /**
     * @protected
     */
    _props: function () {
        this._super();

        if (this._name == null) {
            if (this._options.name == null) {
                throw new Error('A component should have a name');
            }
            else {
                this._name = this._options.name;
            }
        }

        /**
         * @type {ComponentLogStream}
         * @private
         */
        this._logStream = new ComponentLogStream;

    },

    /**
     * Returns the component name
     * @public
     * @returns {string}
     */
    getName: function () {
        return this._name;
    },

    /**
     * @public
     * @returns {ComponentLogStream}
     */
    getLogStream: function () {
        return this._logStream;
    },

    log: function (message, type) {
        this._logStream.log(message);
    }
});
