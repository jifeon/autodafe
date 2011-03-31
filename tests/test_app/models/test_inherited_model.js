var SuperModel = require('test_super_model');

module.exports = TestInheritedModel.inherits( SuperModel );

function TestInheritedModel( params ) {
  this._init( params );
}


TestInheritedModel.get_some_important_value = function() {
  return '42';
};