var SuperModel = require('test_super_model');

var TestInheretedModel = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( TestInheretedModel, SuperModel );


TestInheretedModel.get_some_importentd_value = function() {
  return '42';
};