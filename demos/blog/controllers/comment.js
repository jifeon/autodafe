module.exports = Comment.inherits( require('./json'));

function Comment( params ){
  this._init( params );
}


Comment.prototype.create = function( response, request ){
  if ( !request.user.can('create', this.models.comment ))
    return response.send( new Error('Only users can add comments'), 403 );

  var self      = this;
  var listener  = response.create_listener();
  listener.stack <<= this.models.post.find_by_pk( request.params.post_id );
  listener.success(function( topic ){
    if ( !topic ) return response.send( new Error('Topic not found'), 404 );

    var comment     = new self.models.comment( request.params.comment );
    comment.post_id = topic.id;
    comment.user_id = request.user.model.id;
    response.view_name('comment');
    listener
      .handle_emitter( comment.save() )
      .success( function(){
        response.view_name('main').send({
          result : self.create_url( 'site.view_topic', { topic_id : topic.id })
        });
      });
  })
}


