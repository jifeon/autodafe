var ActiveRelation = require( './active_relation' );

module.exports = HasManyRelation.inherits( ActiveRelation );

function HasManyRelation( params ) {
  this._init( params );
}


HasManyRelation.prototype._init = function( params ) {
  this.super_._init( params );


};