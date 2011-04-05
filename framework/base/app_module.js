module.exports = AppModule.inherits( process.EventEmitter );

function AppModule() {
  throw new Error( 'AppModule is abstract class. You can not instantiate it' );
}


var __ide_hack__ = {
  class_name : 1,
  app        : 1
}


AppModule.prototype._init = function( params ) {
  if ( !params || !params.app ) throw new Error(
    'Link to application is undefined' + ( this.constructor.name
      ? ' in `%s._init`'.format( this.constructor.name )
      : ' in `_init` method of class inherited from AppModule. Also class inherited from AppModule should be defined as ' +
      '`function Name() {}` instead of `var Name = function() {}` because AppModule uses `this.constructor.name` property for logging'
    )
  );

  Object.defineProperty( this, 'class_name', {
    value : this.constructor.name
  } );

  var application = params.app;
  delete params.app;

  Object.defineProperty( this, 'app', {
    value       : application
  });

  if ( !this.constructor.name ) {
    this.app.log(
      'Class inherited from AppModule should be defined as `function Name() {}` instead of `var Name = function() {}`' +
      ' because AppModule uses `this.constructor.name` property for logging',
    'warning', 'AppModule' );
  }
};


AppModule.prototype.log = function ( message, type ) {
  this.app.logger.log( message, type, this.constructor.name );
};