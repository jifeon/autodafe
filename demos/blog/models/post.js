var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Post.inherits( ActiveRecord );

function Post( params ) {
  this._init( params );
}


Post.prototype.get_table_name = function(){
  return 'posts';
}

Post.prototype.relations = function () {
  return {
    'author'  : this.belongs_to( 'user' ).by( 'user_id' )
  }
};