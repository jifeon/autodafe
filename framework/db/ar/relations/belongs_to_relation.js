var ActiveRelation = require( './active_relation' );

module.exports = BelongsToRelation.inherits( ActiveRelation );

function BelongsToRelation( params ) {
  this._init( params );
}