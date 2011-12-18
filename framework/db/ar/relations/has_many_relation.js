var ActiveRelation = require( './active_relation' );

module.exports = HasManyRelation.inherits( ActiveRelation );

function HasManyRelation( params ) {
  this._init( params );
}


HasManyRelation.prototype._init = function( params ) {
  this.limit  = -1;
  this.offset = -1;
  this.index  = null;

  HasManyRelation.parent._init.call( this, params );
};


HasManyRelation.prototype.merge_with = function ( criteria/*, from_scope*/ ) {
  HasManyRelation.parent.merge_with.call( this, criteria/*, from_scope*/ );

  if( criteria.limit > 0 )    this.limit  = criteria.limit;
  if( criteria.offset >= 0 )  this.offset = criteria.offset;
  this.index = criteria.index || this.index;
};


HasManyRelation.prototype.get_options = function () {
  var options = HasManyRelation.parent.get_options.call( this );

  options.limit   = this.limit;
  options.offset  = this.offset;
  options.index   = this.index;

  return options;
};