var BaseActiveRelation = require( './base_active_relation' );

module.exports = StatRelation.inherits( BaseActiveRelation );

function StatRelation( params ) {
  this._init( params );
}


StatRelation.prototype._init = function( params ) {
  params          = params         || {};
  params.options  = params.options || {};
  if ( !params.options.select )                             params.options.select         = 'COUNT(*)';
  if ( typeof params.options.default_value == 'undefined' ) params.options.default_value  = 0;

  StatRelation.parent._init.call( this, params );
};


StatRelation.prototype.merge_with = function ( criteria/*, from_scope*/ ) {
  StatRelation.parent.merge_with.call( this, criteria/*, from_scope*/ );

  this.default_value = criteria.default_value || this.default_value;
};


StatRelation.prototype.get_options = function () {
  var options = StatRelation.parent.get_options.call( this );

  options.select        = this.select;
  options.default_value = this.default_value;

  return options;
};