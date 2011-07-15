var HasManyRelation = require( './has_many_relation' );

module.exports = ManyManyRelation.inherits( HasManyRelation );

function ManyManyRelation( params ) {
  this._init( params );
}