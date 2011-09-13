var AppModule   = require('app_module');

module.exports = Route.inherits( AppModule );

function Route( params ) {
  this._init( params );
}


Route.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.path ) throw new Error( 'Route path cannot be empty' );

  this.controller       = null;
  this.action           = null;
  this.connection_type  = null;

  this._.path           = '';
  this._.path.get       = function(){
    var controller = this.controller || this.app.default_controller;
    // todo: контроллера может не быть
    var action     = this.action     || this.app.router.get_controller( controller ).default_action;
    return controller + '.' + action;
  }

  // valid : ' controller . action | post ', 'controller.action', 'controller|ws', ' controller', '', '|get'
  // pockets : 2 - controller, 4 - action, 6 - connection_type
  this._re = /^\s*((\w+)\s*(\.\s*(\w+)\s*)?)?(([|,]\s*(post|get|delete|http|ws)\s*)*)$/i;

  this._parse( params.route_path );
};


Route.prototype._parse = function ( route_path ) {
  var matches = this._re.exec( route_path );
  if ( !matches ) throw new Error( 'Route path `%s` has bad format'.format( route_path ) );

  this.controller       = matches[2] || null;
  this.action           = matches[4] || null;
  this.connection_type  = matches[6] || null;
};


Route.prototype.is_allowed_con_type = function ( connection_type ) {
  if ( this.connection_type == null ) return true;
};