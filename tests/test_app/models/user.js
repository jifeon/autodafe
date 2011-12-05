var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = User.inherits( ActiveRecord );

function User( params ) {
  this._init( params );
}

User.prototype.get_table_name = function(){
  return 'testbase_ar.users';
}

User.prototype.relations = function(){
  return {
    posts      : this.has_many( 'post' ).by( 'author_id' ),
    post_count : this.stat( 'post' ).by( 'author_id' )
  }
}