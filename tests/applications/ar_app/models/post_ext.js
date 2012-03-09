var ActiveRecord = global.autodafe.db.ActiveRecord;

module.exports = PostExt.inherits( ActiveRecord );

function PostExt( params ) {
  this._init( params );
}


PostExt.prototype._init = function ( params ) {
  PostExt.parent._init.call( this, params );

  this.id     = null;
  this.title  = 'default title';
};


PostExt.prototype.get_table_name = function(){
  return 'posts';
}


PostExt.prototype.get_safe_attributes_names = function(){
  return [ 'title' ];
}


PostExt.prototype.relations = function () {
  return {
    'comments' : this.has_many( 'comment' ).by( 'post_id', {
      order : 'comments.content DESC',
      With  : [
        { post : { alias : 'post' } },
        'author'
      ]
    } )
  }
};