var util = require('util');

/**
 * A base class for all classes using autodafe. Provides convenient inheritance by {@link AtdClass.extend} and events
 * handling by {@link events.EventEmitter}
 * @class AtdClass
 * @constructor
 */
function AtdClass () {

}

/**
 * @static
 * @public
 * @param {object} proto
 * @returns {Function} child class
 */
AtdClass.extend = function (proto) {
    var newClass = function () {};
    util.inherits(newClass, this);
    for (var prop in proto) {
        if (proto.hasOwnProperty(prop)) {
            newClass.prototype[prop] = proto[prop];
        }
    }
    for (prop in this) {
        if (this.hasOwnProperty(prop)) {
            newClass[prop] = this[prop];
        }
    }
    return newClass;
};

module.exports = AtdClass;