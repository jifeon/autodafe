var Model = require('model');

module.exports = TestModel.inherits( Model );

function TestModel( params ) {
  this._init( params );

  this.param = params.param || 42;
}

TestModel.prototype.test = function () {
  return this.param;
};


TestModel.prototype.me = function () {
  return this;
};