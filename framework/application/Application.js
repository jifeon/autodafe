var AtdClass = require('../../lib/AtdClass'),
    AtdError = require('../../lib/AtdError'),
    _ = require('underscore'),
    s = require('sprintf-js').sprintf,
    ApplicationLogStream = require('./ApplicationLogStream'),
    path = require('path'),
    vow = require('vow');

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
        this.log('Application is ready', 'info');
    },

    /**
     * @param {object.<string, boolean|object>} components
     * @see {@link Application} options.components parameter for full description
     * @private
     * @returns {boolean|Array} true if all components are loaded or array of not loaded components
     */
    _loadComponents: function (components) {
        this.log('Loading components');
        var notLoadedComponents = [];
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
            componentParams.path = componentParams.path || path.join('node_modules', 'autodafe-' + componentName);

            var componentPath = path.resolve(this._basePath, componentParams.path);
            this.log('Searching the %s component in path %s', componentName, componentPath);

            try {
                var Component = require(componentPath);
                this.log('Instantiation the %s component', componentName);
                this.load(new Component(componentParams));
            }
            catch (e) {
                this.log('Error while loading component %s', componentName, 'error');
                this.log(e);
                notLoadedComponents.push(componentName);
            }

        }

        if (notLoadedComponents.length) {
            this.log(
                'Loading components complete. Application working without following components:',
                notLoadedComponents.join(' '), 'warning'
            );
            return notLoadedComponents;
        }

        this.log('Components are loaded successfully', 'info');
        return true;
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
        this.log('Loading the %s component', componentName, 'debug');

        if (this._components[componentName]) {
            throw new Error('Try to load more than one component with the same name');
        }
        this._components[componentName] = component;

        component.getLogStream().pipe(this._logStream);
        component.on('request', this._onComponentRequest.bind(this));
        return this;
    },

    /**
     * Removes component with specified name from the application
     * @param {string} componentName
     * @returns {Application} this
     */
    unload: function (componentName) {
        this.log('Unloading the %s component', componentName);
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
     * Allowed log levels
     * @private
     * @type {Array.<string>}
     */
    _logLevels: ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'],

    /**
     * @private
     * @param {Request} request
     */
    _onComponentRequest: function (request) {
        var components = Object.keys(this._components),
            requestsMap = {};
        vow.Promise
            .all(components.map(function (componentName) {
                var component = this.get(componentName),
                    dependencies = component.getDependentComponents(),
                    promise;
                if (!dependencies.length) {
                    promise = component.processRequest(request);
                    if (!vow.isPromise(promise)) {
                        promise = vow.reject(s('`processRequest` method of %s component must return promise', componentName));
                    }
                }
                else {
                    promise = this._waitForDependentComponents(dependencies, requestsMap, function () {
                        return component.processRequest(request);
                    });
                }
                requestsMap[componentName] = promise;
                return promise;
            }, this))
            .fail(function (reason) {
                request.getResponse().sendError(reason);
                this.emit('request:failed', request, reason);
            }, this)
            .done(function () {
                request.complete();
                this.emit('request:processed', request);
            }, this);
    },

    _waitForDependentComponents: function (dependencies, requestsMap, onFulfilled) {
        var deferred = vow.defer();
        process.nextTick(function () {
            var promises = dependencies.map(function (componentName) {
                var dependentPromise = requestsMap[componentName];
                if (!dependentPromise) {
                    return vow.reject(s(
                        'Dependent component %s does not found',
                        componentName
                    ));
                }
                return dependentPromise;
            });

            vow.Promise.all(promises).done(function () {
                onFulfilled().done(deferred.resolve, deferred.reject, deferred);
            }, deferred.reject, deferred);
        });
        return deferred.promise();
    },

    /**
     * @param {string|Error...} message
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
        this._logStream.write(args.join(' ') + '\n');
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

