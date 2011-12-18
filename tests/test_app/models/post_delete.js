var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = PostDelete.inherits( ActiveRecord );

function PostDelete( params ) {
  this._init( params );
}


PostDelete.prototype.get_table_name = function(){
  return 'testbase_ar.posts_for_delete';
}
PostDelete.prototype.get_safe_attributes_names = function(){
  return [ 'title' ];
}