var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = Comment.inherits( ActiveRecord );

function Comment( params ) {
  this._init( params );
}


Comment.prototype.get_table_name = function () {
  return 'comments';
};


Comment.prototype.get_safe_attributes_names = function () {
  return [ 'text' ];
};


Comment.prototype.attributes = function(){
  return {
    'user_id'     : [ 'required' ],
    'post_id'     : [ 'required' ],
    'text'    : [
      'required',
      { max_length : 1024 }
    ]
  };
}


Comment.prototype.relations = function () {
  return {
    'commenter'  : this.belongs_to( 'user' ).by( 'user_id' )
  }
};