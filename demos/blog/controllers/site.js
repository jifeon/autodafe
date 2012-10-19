// наследуем Site от Controller
module.exports = Site.inherits( global.autodafe.Controller );

/**
 * Контроллер, отвечающий за отображение страниц на сайте
 *
 * @constructor
 * @extends Controller
 * @param {Object} params
 */
function Site( params ) {
  this._init( params );
}


Site.prototype._init = function( params ){
  Site.parent._init.call( this, params );

  // все представления для этого контроллера будут искаться в папке views/html
  this.views_folder = 'html';
}


/**
 * Возвращает параметры которые доступны во всех шаблонах
 *
 * @param {Response} response
 * @param {Request} request
 * @return {Object}
 */
Site.prototype.global_view_params = function( response, request ){
  return {
    // из всех шаблонов можно будет обратиться к UserIdentity привязанному к текущему пользователю
    user : request.user
  }
};


/**
 * Функция выполняется при подключении клиента, она пытается авторизовывать пользователя по куки
 *
 * @param {Client} client подключенный клиент
 * @returns {EventEmitter|Boolean} если connect_client возвращает емиттер, то действие из запроса не будет выполнено,
 * пока емиттер не вызовет success, при error на клиент отправится ошибка
 */
Site.prototype.connect_client = function ( client ){
  return this.app.users.login_by_cookie( client );
};


/**
 * Главная страница сайта. Этот метод указан в секции router.rules конфигурационного файла для корня сайта
 *
 * @param {Response} response Ответ, который будет отправлен клиенту
 * @param {Request} request Запрос, инициировавший действие
 */
Site.prototype.index = function ( response, request ) {

  // на странице может выводиться много топиков, они разбиваются на страницы. Для отображения страниц используется
  // специальный виджет - pages
  var pages = this.create_widget( 'pages', {
    // указываем максимальное количество топиков, которое может отображаться на странице. Эта информация берется
    // из параметров приложения в конфигурационном файле
    items_per_page : this.app.params.topics_per_page,
    // в какое действие долны вести ссылки из пейджера
    action_path    : 'site.index',
    // номер текущей страницы
    current_page   : request.params.page,
    // указываем вид выводмиго пейджера в виде списка страниц, такой вид наиболее совместим с bootstrap
    view           : 'ul'
  } );

  // записываем параметры для представления
  response.merge_params({
    // список топиков, который асинхронно запросится в базе данных
    topics   : this.models.topic.find_all({
      offset : pages.start_item,
      limit  : pages.items_per_page,
      order  : 'date desc'
    }),
    // виджет для вывода страниц
    pages   : pages
  });

  // для вывода пэйджера нам также надо знать общее количество топиков
  var listener = response.create_listener();
  listener
    .handle_emitter( this.models.topic.count() )
    .success(function( count ){
      // записываем число топиков в наш виджет
      pages.count = count;

      // отправляем клиенту html/index.html
      response.send();
    });
};


/**
 * Страница создание топика
 */
Site.prototype.create_topic = function ( response, request ) {
  // проверяем может ли текущий пользователь создавать топики
  if ( !request.user.can( 'create', this.models.topic ))
    // если нет возвращаем 403 ошибку
    return response.send( new Error('Only user can create topics'), 403 );

  // отправляем клиенту html/create_topic.html
  response.send();
};


/**
 * Просмотр топика
 */
Site.prototype.view_topic = function ( response, request ) {
  // ищем топик с указанным id
  var listener     = response.create_listener();
  listener.stack <<= this.models.topic.With( 'author', 'comments.commenter' ).find_by_pk( request.params.topic_id );

  listener.success(function( topic ){
    // если топик не найден отправляем 404 ошибку
    if ( !topic ) return response.send( new Error('Topic not found'), 404 );

    // отправляем клиенту html/view_topic.html
    response.send({ topic : topic });
  });
};