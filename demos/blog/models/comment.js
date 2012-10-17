var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = Comment.inherits( ActiveRecord );

function Comment( params ) {
  this._init( params );
}


Comment.prototype.get_table_name = function () {
  return 'comments';
};


Comment.prototype.attributes = function(){
  return {
    'user_id' : 'required',
    'post_id' : 'required',
    'text'    : {
     'safe required'  : true,
      max_length      : 1024,
      prefilters      : 'trim' }
  };
}


Comment.prototype.relations = function () {
  return {
    'commenter'  : this.belongs_to( 'user' ).by( 'user_id' )
  }
};