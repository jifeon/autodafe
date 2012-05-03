module.exports = TestModel.inherits( autodafe.Model );

function TestModel( params ) {
  this._init( params );

  this.param  = params.param || 42;
  this.param1 = 33;
}

TestModel.prototype.attributes = function(){
  return {
    'param1 param2' : 'safe'
  }
}

TestModel.prototype.test = function () {
  return this.param;
};


TestModel.prototype.me = function () {
  return this;
};