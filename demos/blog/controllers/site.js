var Controller  = global.autodafe.Controller;
var crypto      = require('crypto');

module.exports = SiteController.inherits( Controller ); // наследуем от Controller

/**
 * Единственный в данном приложении контроллер, который и отвечает за логику работы приложения
 *
 * @constructor
 * @extends Controller
 * @param {Object} params
 */
function SiteController( params ) {
  this._init( params );

  this.POSTS_PER_PAGE = 5;
}


/**
 * Возвращает параметры которые доступны во всех шаблонах
 *
 * @param {Response} response
 * @param {Client} client
 * @return {Object}
 */
SiteController.prototype.global_view_params = function( response, client ){
  var ui = this.app.users.get_by_client( client );

  return {
    user : ui && ui.model
  }
};


/**
 * Функция выполняется при подключении клиента, она авторизовывает пользователя по куки
 *
 * @param {Client} client подключенный клиент
 * @returns {EventEmitter|Boolean} если connect_client возвращает емиттер, то действие из запроса не будет выполнено, пока
 * емиттер не вызовет success, при error на клиент отправится ошибка
 */
SiteController.prototype.connect_client = function ( client ){

  // таким образом можно получить объек UserIdentity привязанный к текущему пользователю из компонента users. client
  // в свою очередь относится к конкретной сессии, которая может быть уже авторизована и привязана к конкретному
  // UserIdentity. В обратном случае надо произвести авторизацию по cookie
  var ui = this.app.users.get_by_client( client );

  // проверяем не авторизован ли уже наш клиент
  if ( !ui.is_guest() ) return true;

  // если не авторизован считываем параметры для авторизации из cookie
  var login = client.get_cookie( 'blog_login' );
  var pass  = client.get_cookie( 'blog_pass' );

  // если их нет, даже не пытаемся авторизоваться
  if ( !login || !pass ) return false;

  return this._authorize( login, pass, client );
};


/**
 * Главная страница сайта. Этот метод указан в секции router.rules конфигурационного файла для корня сайта
 *
 * @param {Object} params параметры пришедшие с запросом
 * @param {Client} client клиент совершающий действие
 * @param {Object} errors ошибки, которые могут передасться из других действий для того чтобы показать главную страницу
 * с ошибками
 */
SiteController.prototype.index = function ( params, client, errors ) {
  params = params || {};

  var pages = this.create_widget( 'pages', {
    items_per_page : this.POSTS_PER_PAGE,
    action_path    : 'site.index',
    current_page   : params.page,
    view           : 'table'
  } );

  // ищем 10 топиков для показа их на странице и общее кол-во топиков
  var listener = this.app.tools.create_async_listener(
    2, this.show_index.bind( this, client, errors, pages )
  );

  this.models.post.find_all({
    offset : pages.current_page * this.POSTS_PER_PAGE,
    limit  : this.POSTS_PER_PAGE,
    order  : 'date desc'
  })
    .re_emit( 'success', 'error', listener.get_emitter( 'posts' ));

  this.models.post.count()
    .re_emit( 'success', 'error', listener.get_emitter( 'count' ));
};


SiteController.prototype.show_index = function ( client, errors, pages, params ) {
  // ошибку шлем клиенту, отобразится как 500 ошибка
  if( params.error ) return client.send_error( params.error );

  pages.count = params.count;

  // если все хорошо - рендерим вьюшку и отсылаем клиенту
  this.respond( 'posts_list.html', {
    posts   : params.posts,
    errors  : errors ? errors : '',
    pages   : pages
  } ).to( client );
};


/**
 * Регистрация
 *
 * @param {Object} params параметры пришедшие с запросом
 * @param {String} params.pass пароль
 * @param {String} params.login логин
 * @param {Client} client клиент совершающий действие
 */
SiteController.prototype.register = function ( params, client ) {
  var self = this;

  // проверяем существует ли указанный логин
  this.models.user.exists( 'login=:login', {
    login : params.login
  } )
    .on( 'error', client.send_error.bind( client ) )  // 500 ошибка
    .on( 'success', function( user_exists ) {
      // если логин уже занят - отправляем главную страницу с показом ошибки
      if( user_exists ) return self.index( null, client, {
        reg : { login : 'This login already in use' }
      } );

      // если нет создаем модель пользователя
      var user = new self.models.user;

      // задаем ей параметры и сохраняем
      user.set_attributes( params ).save()
        .on( 'error', client.send_error.bind( client ) )      // 500 ошибка
        .on( 'not_valid', function( errors ){
          // не пройдена валидация
          self.index( null, client, { reg : errors } );
        } )

        .on( 'success', function(  ) {
          // все хорошо, логиним клиент
          self._login_client( client, user );

          // и редиректим его на главную
          client.redirect( '/' );
        } );
    } );
};


/**
 * Запрос на вход пользователя
 *
 * @param params
 * @param client
 */
SiteController.prototype.login = function ( params, client ) {
  var self = this;

  // пытаемся авотризовать клиента
  this._authorize(
    params.login,
    crypto.createHash('md5').update( params.pass ).digest("hex"),
    client,
    client.redirect.bind( client, '/' ),                                  // успешно авторизован - редирект на главную
    this.index.bind( this, null, client, {
      login : {login : 'Wrong login or/and password'}
    } )  // показ ошибки на главной
  );
};


/**
 * Запрос на выход пользователя
 *
 * @param params
 * @param client
 */
SiteController.prototype.logout = function ( params, client ) {
  this._logout_client( client );
  client.redirect( '/' );
};


/**
 * Авторизация пользвоателя
 *
 * @private
 * @param {String} login
 * @param {String} pass
 * @param {Client} client
 * @param {Function} [success] функция которая выполнится при успешной авторизации
 * @param {Function} [fail] функция, которая выполнится если авторизация не пройдет
 */
SiteController.prototype._authorize = function ( login, pass, client, success, fail ) {
  var self = this;
  this.models.user.find_by_attributes( {
    login : login,
    pass  : pass
  } )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( user ){
      if ( !user ) return typeof fail == 'function' && fail();

      self._login_client( client, user );
      typeof success == 'function' && success();
    } );
};


SiteController.prototype._login_client = function ( client, user ) {
  this.app.users.authorize_session( client.session, user );

  client.set_cookie( 'blog_login',  user.login, 365 );
  client.set_cookie( 'blog_pass',   user.pass,  365 );
};


SiteController.prototype._logout_client = function ( client ) {
  this.app.users.logout_session( client.session );

  client.set_cookie( 'blog_login',  '' );
  client.set_cookie( 'blog_pass',   '' );
};


SiteController.prototype.create_topic = function ( params, client ) {
  if ( params.name == null ) return this.send_response( 'new_post.html', client );

  var ui    = this.app.users.get_by_client( client );
  var self  = this;
  var post  = new this.models.post;
  post.set_attributes( params );
  post.user_id = ui.model.id;
  post.save()
    .on( 'error', client.send_error.bind( client ) )
    .on( 'not_valid', function( errors ){
      params.error = errors.join('<br/>');
      self.send_response( 'new_post.html', client, params );
    } )

    .on( 'success', function() {
      client.redirect( self.create_url( 'view_topic', { topic_id : post.id } ) );
    } );
};


SiteController.prototype.view_topic = function ( params, client ) {
  var self = this;
  this.models.post.With( 'author', 'comments.commenter' ).find_by_pk( params.topic_id )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( topic ){
      if ( !topic ) return client.send_error( 'Topic not found', 404 );

      self.send_response( 'topic.html', client, {
        topic : topic
      } );
    } );
};


SiteController.prototype.comment = function ( params, client ) {
  var ui    = this.app.users.get_by_client( client );
  var self  = this;

  this.models.post.find_by_pk( params.post_id )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( topic ){
      if ( !topic ) return client.send_error( 'Topic not found', 404 );

      var comment = new self.models.comment;
      comment.set_attributes( params );
      comment.post_id = topic.id;
      comment.user_id = ui.model.id;
      comment.save()
        .on( 'error', client.send_error.bind( client ) )
        .on( 'not_valid', function( errors ){
          self.send_response( 'topic.html', client, {
            topic : topic,
            error : errors.join('<br/>'),
            text  : params.text
          } );
        } )

        .on( 'success', function() {
          client.redirect( self.create_url( 'view_topic', { topic_id : topic.id } ) );
        } );
    } );
};