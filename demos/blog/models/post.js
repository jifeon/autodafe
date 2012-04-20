var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = Post.inherits( ActiveRecord );

function Post( params ) {
  this._init( params );
}


Post.prototype.get_table_name = function(){
  return 'posts';
}


Post.prototype.relations = function () {
  return {
    'author'   : this.belongs_to( 'user' ).by( 'user_id' ),
    'comments' : this.has_many( 'comment' ).by( 'post_id', {
      order : 'comments.date'
    } )
  }
};


Post.prototype.get_safe_attributes_names = function () {
  return ['name', 'description'];
};


Post.prototype.attributes = function(){
  return {
    user_id : [
      'required'
    ],
    name : [
      'required',
      { "max_length"  : 256 }
    ],
    description : [
      'required',
      { "max_length"  : 4096 }
    ]
  };
}
