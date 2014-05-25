var AtdClass = require('../../lib/AtdClass'),
    vow = require('vow');

/**
 * @class Injection
 * @extends AtdClass
 */
var Injection = module.exports = AtdClass.extend(/**@lends Injection#*/{
    /**
     * @protected
     */
    _props: function () {
        this._super();

        this._app = this._options.app;
    },

    /**
     * @constructs
     * @private
     */
    _init: function () {
        this._super();


    },

    inject: function () {
        return vow.fulfill(true);
    }
});
