module.exports = DbExpression;

function DbExpression( params ) {
  this._init( params );
}


DbExpression.prototype._init = function( params ) {
  this.expression = params.expression;
  this.params     = params.params || {};
};


DbExpression.prototype.toString = function () {
  return this.expression;
};