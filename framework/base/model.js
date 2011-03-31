var AppModule = require('app_module');

module.exports = Model.inherits( AppModule );

function Model( params ) {
  this._init( params );
}
