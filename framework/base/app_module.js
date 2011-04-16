var AutodafePart = require( 'autodafe_part' );

module.exports = AppModule.inherits( AutodafePart );

function AppModule() {
  throw new Error( 'AppModule is abstract class. You can not instantiate it' );
}


AppModule.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params || !params.app ) throw new Error(
    'Link to application is not defined' + ( this.class_name
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


AppModule.prototype.log = function ( message, type ) {
  this.app.logger.log( message, type, this.class_name );
};