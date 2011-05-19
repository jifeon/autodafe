var AppModule = require('app_module');
var dust      = require('dust');
var path      = require('path');
var fs        = require('fs');

module.exports = Controller.inherits( AppModule );

function Controller( params ) {
  this._init( params );
}


Controller.prototype._init = function ( params ) {
  this.super_._init( params );

  if ( !params.name )
    throw new Error( 'Parameter `name` is required for Controller creation' );
  this._.name = params.name;

  this.default_action = 'index';
  this.views_path     = 'views';

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


Controller.prototype.run_action = function ( action /*, arg1, arg2, ...*/ ) {
  action = action || this.default_action;

  if ( !action || !this._actions[ action ] || !this[ action ] )
    throw new Error( 'Unspecified action "%s" in Controller "%s"'.format( action, this.name ) );

  var before_action_result = this.before_action.apply( this, arguments );
  if ( before_action_result === false ) return false;

  var args = before_action_result instanceof Array
    ? before_action_result
    : Array.prototype.slice.call( arguments, 1 );

  this[ action ].apply( this, args );

  args.unshift( action );
  this.after_action.apply( this, args );
};


Controller.prototype.render = function ( view, params, callback ) {

  if ( dust.cache[ view ] ) return dust.render( view, params, callback );

  var view_path = path.join( this.app.base_dir, this.views_path, view );

  fs.readFile( view_path, 'UTF8', function( e, template ){
    if ( e ) return callback( e, null );

    var compiled = dust.compile( template, view );

    dust.loadSource( compiled );
    dust.render( view, params, callback );
  } );
};


Controller.prototype.send_response = function ( view, params, session, callback ) {
  callback = callback || this.default_callback;

  this.render( view, params, function( e, data ) {
    if ( e ) callback( e );

    var client = session.client;
    client.send( data );
    callback( null, data );
  } );
};