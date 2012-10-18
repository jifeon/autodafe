module.exports = Post.inherits( require('./json') );

function Post( params ){
  this._init( params );
}


Post.prototype.create = function( response, request ){
  if ( !request.user.can('create', this.models.post ))
    return response.send( new Error('Only users can create topics'), 403 );

  var self  = this;
  var post  = new this.models.post( request.params.post );
  post.user_id = request.user.model.id;

  response
    .view_name('topic')
    .create_listener()
    .handle_emitter( post.save() )
    .success(function(){
      response.view_name('main').send({
        result : self.create_url( 'site.view_topic', { topic_id : post.id })
      })
    });
}