module.exports = Comment.inherits( require('./json'));

/**
 * Контроллер отвечающий за действия с комментариями к топикам
 *
 * @param params
 * @extends Json
 * @constructor
 */
function Comment( params ){
  this._init( params );
}


/**
 * Действие для создания комментария
 *
 * @param {Response} response
 * @param {Request} request
 * @return {*}
 */
Comment.prototype.create = function( response, request ){
  // сначала необходимо проверить есть ли у пользователя права на создание комментария
  if ( !request.user.can('create', this.models.comment ))
    return response.send( new Error('Only users can add comments'), 403 );

  var self      = this;

  // ищем топик, к которому собираемся создавать комментарий
  var listener     = response.create_listener();
  listener.stack <<= this.models.topic.find_by_pk( request.params.topic_id );

  listener.success(function( topic ){
    // если топик не найден, возвращаем 404 ошибку
    if ( !topic ) return response.send( new Error('Topic not found'), 404 );

    // создаем комментарий
    var comment     = new self.models.comment( request.params.comment );
    comment.topic_id = topic.id;
    comment.user_id  = request.user.model.id;

    // задаем имя представления в этом месте на случай, если наш комментарий не пройдет валидацию
    // и попадет в метод Json.validation_error
    response.view_name('comment');

    // сохраняем комментарий
    listener
      .handle_emitter( comment.save() )
      .success( function(){

        // в результате отправляем УРЛ, на который надо перенаправить клиента
        // клиент получит что-то вроде { errors : null, result : '/topic/4' }
        response.view_name('main').send({
          result : self.create_url( 'site.view_topic', { topic_id : topic.id })
        });
      });
  })
}


