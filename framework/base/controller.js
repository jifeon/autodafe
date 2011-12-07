var AppModule = global.autodafe.AppModule;
var path      = require('path');
var fs        = require('fs');
var dust      = require('dust.js');

// disable whitespace compression
dust.optimizers.format = function( ctx, node ) {
  return node
};

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
  this.dust           = dust;
  this.models         = this.app.models;
};


Controller.prototype.before_action = function ( action, params, client ) {};
Controller.prototype.after_action = function ( action /*, params, client*/ ) {};


Controller.prototype.run_action = function ( action, params, client ) {
  if ( !action || typeof this[ action ] != 'function' )
    throw new Error( 'Unspecified action "%s" in Controller "%s"'.format( action, this.name ) );

  params = params || {};
  var before_action_result = this.before_action( action, params, client );
  if ( before_action_result === false ) return false;

  var args = before_action_result instanceof Array
    ? before_action_result
    : [ params, client ];

  var res = this[ action ].apply( this, args );

  args.unshift( action );
  this.after_action.apply( this, args );

  return res;
};


Controller.prototype.get_view_path = function ( view ) {
  return path.join( this.app.base_dir, this.views_path, view );
};


Controller.prototype.render = function ( view, params, callback ) {
  this.app.load_views();
  return this.dust.render( view, params, callback );
};


Controller.prototype.send_response = function ( view, client, params, callback ) {
  if ( typeof callback != 'function' ) callback = this.default_callback;
  params   = params   || {};

  params.url = this.make_dust_url.bind( this );

  this.render( view, params, function( e, data ) {
    if ( e ) callback( e );
    var action = params.ws_client_action ? params.ws_client_action : '';
    client.send( data, action );
    callback( null, data );
  } );
};


Controller.prototype.create_url = function ( route_path, params ) {
  return this.app.router.create_url( route_path, params, this.name, this.default_action );
};


Controller.prototype.make_dust_url = function ( chunk, context, bodies, params ) {
  var self = this;

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' ) params[ param ] = this.__get_body_text( chunk, context, value );
  }

  return bodies.block

    ? chunk.tap( function( data ) {
      return self.create_url( data, params );
    }).render( bodies.block, context ).untap()

    : chunk.write( this.create_url( '', params ) );
};


Controller.prototype.__get_body_text = function ( chunk, context, body ) {
  var result = '';

  var old_write = chunk.write;
  chunk.write = function( text ) {
    result += text;
    return chunk;
  }
  body( chunk, context );
  chunk.write = old_write;

  return result;
};