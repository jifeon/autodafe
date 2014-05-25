var AtdClass = require('../../lib/AtdClass'),
    ComponentLogStream = require('./ComponentLogStream'),
    vow = require('vow');

/**
 * @class Component
 * @extends AtdClass
 * @params {object} options
 * @param {string} [options.name] The name of the component. Should be specified inside the options or by the
 * {@link Component._name} protected property
 * @param {Application} [options.app] Will be set automatically if a component loaded through
 * {@link Application._loadComponents} method (you specified it in config for application)
 * @param {string} [options.path] The path that was used to load component by application. May be relative to
 * {@link Application._basePath} or absolute
 * @throws {Error} if the name is not specified
 */
var Component = module.exports = AtdClass.extend(/**@lends Component*/{
    /**
     * @protected
     * @type {string}
     */
    _name: null,

    /**
     * @type {Function}
     * @protected
     */
    _RequestConstructor: require('../Request'),

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
         * The absolute path have been used to load component by application.
         * @type {string}
         * @private
         */
        this._path = this._options.path || '';

        /**
         * @type {ComponentLogStream}
         * @private
         */
        this._logStream = new ComponentLogStream;

        /**
         * @type {?Application}
         * @protected
         */
        this._app = this._options.app;

        if (!this._app) {
            this.log('Component working outside of application', 'warning');
        }
    },

    /**
     * @param {object} [options] options for creating request
     * @returns {Request}
     * @protected
     * @fires Component#request
     */
    _createRequest: function (options) {
        options = options || {};
        options.type = options.type || this.getName();
        var Request = this._RequestConstructor,
            request = new Request(options);

        /**
         * @event Component#request
         * @param {Request} request
         */
        process.nextTick(this.emit.bind(this, 'request', request));
        return request;
    },

    /**
     * @public
     * @param {Request} request
     */
    processRequest: function (request) {
        return vow.cast(true);
    },

    getDependentComponents: function () {
        return [];
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

    getPath: function () {
        return this._path;
    },

    /**
     * Allowed log levels
     * @private
     * @type {Array.<string>}
     */
    _logLevels: ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'],

    /**
     * The log stream usually is piped to {@link Application._logStream}
     * @public
     * @param {string} message
     * @param {string} type
     * @see {@link Application.log} for arguments description
     * todo: make mixin WithLogger for Component and Application
     */
    log: function (message, type) {
        if (message instanceof Error) {
            type = 'error';
            message = message.stack;
        }

        // todo: move logic to ApplicationLogStream
        var args = Array.prototype.slice.call(arguments, 0);
        type = args.pop();
        if (!~this._logLevels.indexOf(type)) {
            args.push(type);
            type = 'debug';
        }
        this._logStream.log(args.join(' ') + '\n');
    },

    _completeRequest: function () {
        return vow.cast(true);
    }
});
