var ActiveRelation = require( './active_relation' );

module.exports = BelongsToRelation.inherits( ActiveRelation );

function BelongsToRelation( params ) {
  this._init( params );
}


BelongsToRelation.prototype._init = function( params ) {
  this.super_._init( params );


};