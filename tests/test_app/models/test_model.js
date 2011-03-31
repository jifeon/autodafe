var Model = require('model');

module.exports = TestModel.inherits( Model );

function TestModel( params ) {
  this._init( params );
}