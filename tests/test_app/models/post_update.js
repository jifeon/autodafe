var ActiveRecord = require( 'db/ar/active_record' );

module.exports = PostUpdate.inherits( ActiveRecord );

function PostUpdate( params ) {
  this._init( params );
}


PostUpdate.table_name           = 'testbase_ar.posts_for_update';
PostUpdate.safe_attribute_names = [ 'title' ];