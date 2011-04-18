var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Post.inherits( ActiveRecord );

function Post( params ) {
  this._init( params );
}


Post.table_name = 'posts';
