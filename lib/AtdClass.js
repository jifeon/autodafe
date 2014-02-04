var util = require('util');

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
    constructor: AtdClass,

    _init: function () {

    },

    _props: function () {

    }
};

var superRE = /_super/;

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
 * @static
 * @public
 * @param {object} proto
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