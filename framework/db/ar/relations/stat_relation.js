var ActiveRelation = require( './active_relation' );

module.exports = StatRelation.inherits( ActiveRelation );

function StatRelation( params ) {
  this._init( params );
}


StatRelation.prototype._init = function( params ) {
  this.super_._init( params );


};