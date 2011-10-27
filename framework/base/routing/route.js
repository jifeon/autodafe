var AppModule   = require('app_module');

module.exports = Route.inherits( AppModule );

function Route( params ) {
  this._init( params );
}


Route.prototype._init = function( params ) {
  this.super_._init( params );

  if ( typeof params.path != 'string' )
      throw new Error( 'Route path should be string. Type of `%s` is %s'.format( params.path, typeof params.path ) );

    if ( !params.router ) throw new Error( 'Link to router is required for Route creation' );

  this.controller       = null;
  this.action           = null;
  this.connection_types = [];
  this._.router         = params.router;

  this._.path           = '';
  this._.path.get       = function(){
    var controller = this.controller || this.app.default_controller;
    // todo: контроллера может не быть
    var action     = this.action     || this.router.get_controller( controller ).default_action;
    return controller + '.' + action;
  }

  var self = this;
  this.rule_params = [];
  this.rule_re     = {};

  this._source_rule = params.rule;
  var re_text = this._source_rule.replace( /<(\w+):(.+?)>/g, function( all, $1, $2 ){
    self.rule_params.push( $1 );
    self.rule_re[ $1 ] = new RegExp( '^' + $2 + '$' );
    return '(' + $2 + ')';
  } );
  this.rule = new RegExp( '^\/' + re_text + '\/?$' );

  // valid : ' controller . action | post ', 'controller.action', 'controller|ws', ' controller', '', '|get'
  // pockets : 2 - controller, 4 - action, 6 - connection_type
  this._re = /^\s*((\w+)\s*(\.\s*(\w+)\s*)?)?(([|,]\s*(post|get|delete|http|ws)\s*)*)$/i;

  this._parse( params.path );
};


Route.prototype._parse = function ( route_path ) {
  var matches = this._re.exec( route_path );
  if ( !matches ) throw new Error( 'Route path `%s` has bad format'.format( route_path ) );

  this.controller       =   matches[2] || null;
  this.action           =   matches[4] || null;
  this.connection_types = ( matches[6] || '' ).split( /[\s|,]+/ ).filter( Boolean );
  if ( ~this.connection_types.indexOf( 'http' ) ) this.connection_types.push( 'post', 'get', 'delete' );
};


Route.prototype.is_allowed_con_type = function ( connection_type ) {
  return !this.connection_types.length || ~this.connection_types.indexOf( connection_type );
};


Route.prototype.has_params = function ( params ) {
  return this.rule_params.every( function( param ) {
    return param in params && this.rule_re[ param ].test( params[ param ] );
  }, this );
};


Route.prototype.get_rule = function ( params ) {
  return this._source_rule.replace( /<(\w+):(.+?)>/g, function( all, $1, $2 ){
    var param = params[ $1 ];
    delete params[ $1 ];
    return param;
  } );
};