module.exports = DbExpression;

/**
 * Класс представляет SQL выражение, не требующее экранирования
 *
 * @constructor
 * @property {String|Object} expression SQL выражение
 * @property {Object} params параметры выражения
 */
function DbExpression( expression, params ) {
  this._init( expression, params );
}

/**
 * Инициализация класса
 *
 * @param {String|Object} expression
 * @param {Object} params
 */
DbExpression.prototype._init = function( expression, params ) {
  if ( Object.isObject( expression ) ) {
    this.expression = expression.expression;
    this.params     = expression.params || {};
  }
  else {
    this.expression = expression;
    this.params     = params || {};
  }
};

/**
 * Возвращает строковое представление выражения
 *
 * @public
 * @returns {String} Возвращает expression
 */
DbExpression.prototype.toString = function () {
  return this.expression;
};