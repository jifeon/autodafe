var AtdClass = require('../lib/AtdClass');

/**
 * @class Component
 * @extends AtdClass
 */
var Component = module.exports = AtdClass.extend(/**@lends Component*/{
    /**
     * @protected
     */
    _props: function () {
        this._super();

        if (this._options.name === undefined) {
            throw new Error('A component should have a name');
        }

        /**
         * @type {string}
         * @private
         */
        this._name = this._options.name;
    }
});

