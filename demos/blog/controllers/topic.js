module.exports = Topic.inherits( require('./json') );

/**
 * Контроллер отвечающий за действия с топиками
 *
 * @param params
 * @extends Json
 * @constructor
 */
function Topic( params ){
  this._init( params );
}


/**
 * Действие для создания топика
 *
 * @param {Response} response
 * @param {Request} request
 * @return {*}
 */
Topic.prototype.create = function( response, request ){
  // сначала необходимо проверить есть ли у пользователя права на создание топика
  if ( !request.user.can('create', this.models.topic ))
    return response.send( new Error('Only users can create topics'), 403 );

  var self  = this;

  // создаем топик
  var topic  = new this.models.topic( request.params.topic );
  topic.user_id = request.user.model.id;

  response
    // задаем имя представления в этом месте на случай, если наш топик не пройдет валидацию
    // и попадет в метод Json.validation_error
    .view_name('topic')
    .create_listener()
    .handle_emitter( topic.save() )
    .success(function(){

      // при успешном сохранении отправляем клиенту json/main.json
      response.view_name('main').send({

        // в результат записываем УРЛ на который надо перейти клиенту (например: /topic/5) для просмотра
        // созданного топика
        result : self.create_url( 'site.view_topic', { topic_id : topic.id })
      })
    });
}