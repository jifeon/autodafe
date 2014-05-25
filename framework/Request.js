var AtdClass = require('../lib/AtdClass'),
    Response = require('./Response');

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

        this._response = new Response;

        this._completed = false;

        this._data = {};
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
    },

    getResponse: function () {
        return this._response;
    },

    complete: function () {
        this._completed = true;
    },

    setData: function (name, data) {
        this._data[name] = data;
    },

    getData: function (name) {
        return this._data[name] || null;
    }
});
