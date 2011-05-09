var AppModule = require('app_module');

module.exports = Controller.inherits( AppModule );

function Controller( params ) {
  this._init( params );
}


Controller.prototype._init = function ( params ) {
  this.super_._init( params );

  if ( !params.name )
    throw new Error( 'Parameter `name` is required for Controller creation' );
  this.name = params.name;

  this.default_action = 'index';
  this._actions = {};

  this.allow_actions( 'index' );
};


Controller.prototype.before_action = function ( action ) {};
Controller.prototype.after_action = function ( action ) {};


Controller.prototype.allow_actions = function () {
  Array.prototype.slice.call( arguments ).forEach( function( action ) {
    this._actions[ action ] = true;
  }, this );
};


Controller.prototype.deny_actions = function () {
  Array.prototype.slice.call( arguments ).forEach( function( action ) {
    this._actions[ action ] = false;
  }, this );
};


Controller.prototype.run_action = function ( action, args ) {
  action = action || this.default_action;

  if ( !action || !this._actions[ action ] || !this[ action ] )
    throw new Error( 'Unspecified action "%s" in Controller "%s"'.format( action, this.name ) );

  args = args || [];
  args.unshift( action );

  var before_action_result = this.before_action.apply( this, args );
  if ( before_action_result === false ) {
    args.shift();
    return false;
  }

  if ( before_action_result instanceof Array ) {
    args.shift();
    args = before_action_result;
    args.unshift( action );
  }

  this[ action ].apply( this, args.slice( 1 ) );
  this.after_action.apply( this, args );
  args.shift();
};