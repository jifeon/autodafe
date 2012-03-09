module.exports = User.inherits( autodafe.db.ActiveRecord );

function User( params ) {
  this._init( params );
}


User.prototype.get_table_name = function(){
  return 'users';
}


User.prototype.relations = function(){
  return {
    posts      : this.has_many( 'post' ).by( 'author_id' ),
    post_count : this.stat( 'post' ).by( 'author_id' )
  }
}