var ActiveRelation = require( './active_relation' );

module.exports = HasOneRelation.inherits( ActiveRelation );

function HasOneRelation( params ) {
  this._init( params );
}