var AtdClass = require('../lib/AtdClass');

/**
 * @class Request
 * @extends AtdClass
 */
var Request = module.exports = AtdClass.extend(/**@lends Request*/{
    /**
     * @protected
     */
    _props: function () {
        this._super();

        this._type = this._options.type || '';
    },

    /**
     * @protected
     * @constructs
     */
    _init: function () {
        this._super();

    },

    /**
     * @public
     * @returns {string}
     */
    getType: function () {
        return this._type;
    },

    getPath: function () {
        return '';
    },

    getParams: function () {
        return {};
    },

    /**
     * @public
     * @abstract
     * @param {Callback} callback
     */
    process: function (callback) {
        callback();
    }
});