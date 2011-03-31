var Model = require('model');

module.exports = TestSuperModel.inherits( Model );

function TestSuperModel( params ) {
  this._init( params );
}


var models = {};


TestSuperModel.model = function( clazz, app ) {
  var existed_inst = models[ clazz.get_some_important_value() ];
  return existed_inst || ( models[ clazz.get_some_important_value() ] = new clazz({
    app : app
  }) );
}