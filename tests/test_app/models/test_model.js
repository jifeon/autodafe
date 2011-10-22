var Model = require('model');

module.exports = TestModel.inherits( Model );

TestModel.prototype.get_safe_attributes_names = function(){
  return [ 'param1', 'param2' ];
}

function TestModel( params ) {
  this._init( params );

  this.param  = params.param || 42;
  this.param1 = 33;
}

TestModel.prototype.test = function () {
  return this.param;
};


TestModel.prototype.me = function () {
  return this;
};