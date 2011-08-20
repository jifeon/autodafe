var ActiveRelation = require( './active_relation' );

module.exports = HasManyRelation.inherits( ActiveRelation );

function HasManyRelation( params ) {
  this._init( params );
}


HasManyRelation.prototype._init = function( params ) {
  this.limit  = -1;
  this.offset = -1;
  this.index  = null;

  this.super_._init( params );
};


HasManyRelation.prototype.merge_with = function ( criteria/*, from_scope*/ ) {
  this.super_.merge_with( criteria/*, from_scope*/ );

  if( criteria.limit > 0 )    this.limit  = criteria.limit;
  if( criteria.offset >= 0 )  this.offset = criteria.offset;
  this.index = criteria.index || this.index;
};


HasManyRelation.prototype.get_options = function () {
  var options = this.super_.get_options();

  options.limit   = this.limit;
  options.offset  = this.offset;
  options.index   = this.index;

  return options;
};