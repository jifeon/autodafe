var Model = require('model');

module.exports = User.inherits( Model );

function User( params ) {
  this._init( params );

  this.role = params.role;
}