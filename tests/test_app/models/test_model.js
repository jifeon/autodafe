var Model = require('model');

var TestModel = module.exports = function( params ) {
  this._init( params );
};

require('sys').inherits( TestModel, Model );