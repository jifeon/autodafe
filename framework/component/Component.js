var AtdClass = require('../../lib/AtdClass'),
    ComponentLogStream = require('./ComponentLogStream');

/**
 * @class Component
 * @extends AtdClass
 * @params {object} options
 * @param {string} [options.name] The name of the component. Should be specified inside the options or by the
 * {@link Component._name} protected property
 * @param {Application} [options.app] Will be set automatically if a component loaded through
 * {@link Application._loadComponents} method (you specified it in config for application)
 * @throws {Error} if the name is not specified
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
         * @type {?Application}
         * @protected
         */
        this._app = this._options.app;

        if (!this._app) {
            // todo: log warning
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
     * Returns log stream for the component
     * @public
     * @returns {ComponentLogStream}
     */
    getLogStream: function () {
        return this._logStream;
    },

    /**
     * The log stream usually is piped to {@link Application._logStream}
     * @public
     * @param {string} message
     * @param {string} type
     * @see {@link Application.log} for arguments description
     */
    log: function (message, type) {
        this._logStream.log(message);
    }
});
