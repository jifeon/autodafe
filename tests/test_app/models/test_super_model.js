var Model = require('model');

var TestSuperModel = module.exports = function( params ) {
  this._init( params );
};


require('sys').inherits( TestSuperModel, Model );

var models = {};
TestSuperModel.model = function( clazz, app ) {
  var existed_inst = models[ clazz.get_some_importentd_value() ];
  return existed_inst || ( models[ clazz.get_some_importentd_value() ] = new clazz({
    app : app
  }) );
}