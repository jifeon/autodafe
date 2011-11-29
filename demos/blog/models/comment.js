var ActiveRecord = require( 'db/ar/active_record' );

module.exports = Comment.inherits( ActiveRecord );

function Comment( params ) {
  this._init( params );
}


Comment.prototype.get_table_name = function () {
  return 'comments';
};


Comment.prototype.attributes_description = function(){
  return {
    'user_id'     : [ 'required' ],
    'subject_id'  : [ 'required' ],
    'text'    : [
      'required',
      { lesser : 1024 }
    ]
  };
}


Comment.prototype.relations = function () {
  return {
    'commenter'  : this.belongs_to( 'user' ).by( 'user_id' )
  }
};