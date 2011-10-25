var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Post.inherits( ActiveRecord );

function Post( params ) {
  this._init( params );
}

Post.prototype.get_table_name = function(){
  return 'testbase_ar.posts';
}
Post.prototype.get_safe_attributes_names = function(){
  return [ 'title' ];
}

Post.prototype.relations = function(){
  return {
    author        : this.belongs_to( 'user' ).by( 'author_id' ),
    first_comment : this.has_one( 'comment' ).by( 'post_id', {
      order : 'first_comment.content'
    } ),
    comments      : this.has_many( 'comment' ).by( 'post_id', {
      order : 'comments.content DESC'
    } ),
    comment_count : this.stat( 'comment' ).by( 'post_id' ),
    categories    : this.many_many( 'category' ).by( 'post_category( post_id, category_id )' )
  }
}