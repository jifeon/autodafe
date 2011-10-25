var ActiveRecord = require( 'db/ar/active_record' );

module.exports = PostUpdate.inherits( ActiveRecord );

function PostUpdate( params ) {
  this._init( params );
}


PostUpdate.prototype.get_table_name = function(){
  return 'testbase_ar.posts_for_update';
}
PostUpdate.prototype.get_safe_attributes_names = function(){
  return [ 'title' ];
}