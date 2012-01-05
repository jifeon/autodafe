var path = require('path');

module.exports = Controller.inherits( autodafe.AppModule );

function Controller( params ) {
  this._init( params );
}


Controller.prototype.dust = require('dust.js');


Controller.prototype._init = function ( params ) {
  Controller.parent._init.call( this, params );

  if ( !params.name )
    throw new Error( 'Parameter `name` is required for Controller creation' );
  this._.name = params.name;

  this.default_action = 'index';
  this.models         = this.app.models;

  this._url_function_for_dust     = this._url_function_for_dust.bind( this );
  this._widget_function_for_dust  = this._widget_function_for_dust.bind( this );
};


Controller.prototype.before_action  = function ( action, params, client ) {};
Controller.prototype.after_action   = function ( action /*, params, client*/ ) {};
Controller.prototype.connect_client = function ( client ) {};


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


Controller.prototype.render = function ( view, params, callback ) {
  this.app.load_views();
  return this.dust.render( view, params, callback );
};


Controller.prototype.send_response = function ( view, client, params, callback ) {
  if ( typeof callback != 'function' ) callback = this.default_callback;
  params   = params   || {};

  params.url    = this._url_function_for_dust;
  params.widget = this._widget_function_for_dust;

  this.render( view, params, function( e, data ) {
    if ( e ) callback( e );
    var action = params.ws_client_action || '';
    client.send( data, action );
    callback( null, data );
  } );
};


Controller.prototype.create_url = function ( route_path, params ) {
  return this.app.router.create_url( route_path, params, this.name, this.default_action );
};


Controller.prototype.create_widget = function( widget_name, params ){
  return this.app.components.create_widget( widget_name, params );
}


Controller.prototype._url_function_for_dust = function ( chunk, context, bodies, params ) {
  var self = this;

  for ( var param in params ) {
    var value = params[ param ];
    if ( typeof value == 'function' )
      params[ param ] = this.app.tools.get_dust_chunk_body_content( chunk, context, value );
  }

  return bodies.block

    ? chunk.tap( function( data ) {
      return self.create_url( data, params );
    }).render( bodies.block, context ).untap()

    : chunk.write( this.create_url( '', params ) );
};


Controller.prototype._widget_function_for_dust = function( chunk, context, bodies, params ){
  var self = this;
    return chunk.map( function( chunk ){
      var widget = context.get( params.name );
      widget.render( function( data ){
        chunk.end( data );
      } )
    } );
};
