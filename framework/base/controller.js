var AppModule = require('app_module');

module.exports = Controller.inherits( AppModule );

function Controller( params ) {
  this._init( params );
}

Controller.prototype.actions        = [ 'index' ];
Controller.prototype.default_action = 'index';


Controller.prototype._init = function ( params ) {
  this.super_._init( params );

  this._actions = {};

  for ( var a = 0, a_ln = this.actions.length; a < a_ln; a++ ) {
    this._actions[ this.actions[a] ] = 1;
  }
};


Controller.prototype.before_action = function ( action ) {};
Controller.prototype.after_action = function ( action ) {};


Controller.prototype.run_action = function ( action, args ) {
  action = action || this.default_action;

  if ( !this._actions[ action ] || !this[ action ] )
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