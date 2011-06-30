var ActiveRecord = require( 'db/ar/active_record' );

module.exports = PostDelete.inherits( ActiveRecord );

function PostDelete( params ) {
  this._init( params );
}


PostDelete.table_name           = 'testbase_ar.posts_for_delete';
PostDelete.safe_attribute_names = [ 'title' ];