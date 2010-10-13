var DBExpression = module.exports = function( params ) {
  this._init( params );
};


DBExpression.prototype._init = function( params ) {
  this.expression = params.expression;
  this.params     = params.params || {};
};


DBExpression.prototype.toString = function () {
  return this.expression;
};