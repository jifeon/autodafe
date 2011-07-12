var ActiveRelation = require( './active_relation' );

module.exports = ManyManyRelation.inherits( ActiveRelation );

function ManyManyRelation( params ) {
  this._init( params );
}


ManyManyRelation.prototype._init = function( params ) {
  this.super_._init( params );


};