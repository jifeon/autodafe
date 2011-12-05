var Model = global.autodafe.Model;

module.exports = User.inherits( Model );

function User( params ) {
  this._init( params );

  this.role = params.role;
}