var BaseActiveRelation = require( './base_active_relation' );

module.exports = StatRelation.inherits( BaseActiveRelation );

function StatRelation( params ) {
  this._init( params );
}


StatRelation.prototype._init = function( params ) {
  this.super_._init( params );

  this.select         = 'COUNT(*)';
  this.default_value  = 0;
};


StatRelation.prototype.merge_with = function ( criteria/*, from_scope*/ ) {
  this.super_.merge_with( criteria/*, from_scope*/ );

  this.default_value = criteria.default_value || this.default_value;
};


StatRelation.prototype.get_options = function () {
  var options = this.super_.get_options();

  options.select        = this.select;
  options.default_value = this.default_value;

  return options;
};