var ActiveRelation = require( './active_relation' );

module.exports = HasOneRelation.inherits( ActiveRelation );

function HasOneRelation( params ) {
  this._init( params );
}


HasOneRelation.prototype._init = function( params ) {
  this.super_._init( params );


};