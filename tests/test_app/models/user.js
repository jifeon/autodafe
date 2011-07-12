var ActiveRecord = require('db/ar/active_record');

module.exports = User.inherits( ActiveRecord );

function User( params ) {
  this._init( params );
}

User.table_name           = 'testbase_ar.users';

User.prototype.relations = function(){
  return {
    posts      : this.has_many( 'post' ).by( 'author_id' ),
    post_count : this.stat( 'post' ).by( 'author_id' )
  }
}