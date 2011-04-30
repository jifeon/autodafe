var AutodafePart = require( 'autodafe_part' );

module.exports = AppModule.inherits( AutodafePart );

function AppModule( params ) {
  this._init( params );
}


AppModule.prototype._init = function( params ) {
  this.super_._init( params );

  var Application = require( 'application' );

  if ( !params || !Application.is_instantiate( params.app ) ) throw new Error(
    'Link to application is not defined or has wrong type' + ( this.class_name
      ? ' in `%s._init`'.format( this.class_name )
      : ' in `_init` method of class inherited from AppModule. Also class inherited from AppModule should be defined as ' +
      '`function Name() {}` instead of `var Name = function() {}` because AppModule uses `this.constructor.name` property for logging'
    )
  );

  this._.app = params.app;
  delete params.app;

  if ( !this.class_name ) {
    this.app.log(
      'Class inherited from AppModule should be defined as `function Name() {}` instead of `var Name = function() {}`' +
      ' because AppModule uses `this.constructor.name` property for logging',
    'warning', 'AppModule' );
  }
};


AppModule.prototype.log = function ( message, level ) {
  this.app.logger.log( message, level, this.class_name );
};