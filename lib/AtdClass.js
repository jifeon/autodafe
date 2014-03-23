var util = require('util');

/**
 * @typedef {function(error:?Error)} Callback
 */

/**
 * A base class for all classes using autodafe. Provides convenient inheritance by {@link AtdClass.extend} and events
 * handling by {@link events.EventEmitter}
 * @class AtdClass
 * @constructor
 */
function AtdClass (options) {
    this._options = options || {};

    this._props();
    this._init();
}

AtdClass.prototype = {
    // todo: redefine constructor
    constructor: AtdClass,

    /**
     * Use for calling a method with the same name from the parent class.
     * @protected
     * @see injectSuper
     */
    _super: function () {
        throw new Error('Unexpected usage of `_super` method');
    },

    /**
     * The place for defining properties, do not make a logic here, this is just for properties declaration
     * @protected
     */
    _props: function () {
    },

    /**
     * @protected
     * @constructor
     */
    _init: function () {
    },

    /**
     * @type {Callback}
     * @param {?Error} e
     * @protected
     */
    _stdCallback: function (e) {
        if (e) {
            throw e;
        }
    }
};

var superRE = /_super/;

/**
 * Inject the super property to the method for calling method from parent class
 * @param {function} newClass new class constructor
 * @param {object} proto
 * @param {string} propName
 * todo: throw an error if the method does not exist in the parent class
 */
function injectSuper(newClass, proto, propName) {
    var self = this;
    newClass.prototype[propName] = function () {
        var oldSuper = this._super;
        this._super = self.prototype[propName];
        var result = proto[propName].apply(this, arguments);
        this._super = oldSuper;
        return result;
    };
}

/**
 * Static method provided inheritance
 * @static
 * @public
 * @param {object} proto prototype for child class
 * @returns {Function} child class
 */
AtdClass.extend = function (proto) {
    var newClass = function () {
        AtdClass.apply(this, arguments);
    };
    util.inherits(newClass, this);

    for (var propName in proto) {
        if (!proto.hasOwnProperty(propName)) {
            continue;
        }

        var prop = proto[propName];
        if (typeof prop == 'function') {
            if (superRE.test(prop.toString())) {
                injectSuper.call(this, newClass, proto, propName);
            }
            else if (propName == '_init' || propName == '_props') {
                throw new Error('The `_props` and `_init` methods should invoke these methods of parent class');
            }
            else {
                newClass.prototype[propName] = prop;
            }
        }
        else {
            newClass.prototype[propName] = prop;
        }
    }

    for (var staticProp in this) {
        if (this.hasOwnProperty(staticProp)) {
            newClass[staticProp] = this[staticProp];
        }
    }

    return newClass;
};

module.exports = AtdClass;