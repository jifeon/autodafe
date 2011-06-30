var ActiveRecord = require( 'db/ar/active_record' );

module.exports = PostExt.inherits( ActiveRecord );

function PostExt( params ) {
  this._init( params );
}


PostExt.prototype._init = function ( params ) {
  this.super_._init( params );

  this.id     = null;
  this.title  = 'default title';
};


PostExt.table_name           = 'testbase_ar.posts_for_delete';
PostExt.safe_attribute_names = [ 'title' ];