module.exports = DbExpression;

function DbExpression( expression, params ) {
  this._init( expression, params );
}


DbExpression.prototype._init = function( expression, params ) {
  if ( Object.isObject( expression ) ) {
    this.expression = expression.expression;
    this.params     = expression.params || {};
  }

  this.expression = expression;
  this.params     = params || {};
};


DbExpression.prototype.toString = function () {
  return this.expression;
};