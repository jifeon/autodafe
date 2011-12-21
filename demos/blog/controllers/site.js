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

  this.POSTS_PER_PAGE = 10;
}


/**
 * Метод для отправки view клиенту. Перегружает Controller.send_response, добавляет в параметры, передаваемые в view
 * ссылку на модель пользователя user, если пользоваетель гость, user будет равен null
 *
 * @param {String} view название вьюшки, которую будем рендерить
 * @param {Client} client клиент которому будет отправлена view
 * @param {Object} params параметры для передачи в вью
 */
SiteController.prototype.send_response = function ( view, client, params ) {
  params = params || {};

  var ui = this.app.users.get_by_client( client );
  if ( !ui.is_guest() ) params.user = ui.model;

  SiteController.parent.send_response.call( this, view, client, params );
};


/**
 * Функция выполняется при подключении клиента, она авторизовывает пользователя по куки
 *
 * @param {Client} client подключенный клиент
 * @return {EventEmitter|Boolean} если connect_client возвращает емиттер, то действие из запроса не будет выполнено, пока
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
 * @param {String} error ошибка которая может передасться из других действий для того чтобы показать главную страницу
 * с ошибкой
 */
SiteController.prototype.index = function ( params, client, error ) {
  var self = this,
      page = parseInt( params.page ) - 1 || 0;

  // ищем 10 топиков для показа их на странице и общее кол-во топиков
  var listener = this.app.tools.create_async_listener(
    2, this.show_index.bind( this, client, error, page )
  );

  var on_error = client.send_error.bind( client );

  this.models.post.find_all({
    offset : page * this.POSTS_PER_PAGE,
    limit  : this.POSTS_PER_PAGE,
    order  : 'date desc'
  })
    .on( 'error', on_error )
    .re_emit( 'success', listener.get_emitter( 'posts' ));

  this.models.post.count()
    .on( 'error', on_error )
    .re_emit( 'success', listener.get_emitter( 'count' ));
};


SiteController.prototype.show_index = function ( client, error, page, send_params ) {
  // ошибку шлем клиенту, отобразится как 500 ошибка
  if( send_params.error ) return client.send_error( send_params.error );

  // если все хорошо - рендерим вьюшку и отсылаем клиенту
  this.send_response( 'posts_list.html', client, {
    posts : send_params.posts,
    error : error ? error : '',
    pages : this.create_widget( 'pages', {
      count          : send_params.count,
      items_per_page : this.POSTS_PER_PAGE,
      link_to        : 'site.index',
      link_params    : {
        page : page + 1
      }
      } )
  } )
};


/**
 * Регистрация
 *
 * @param {Object} params параметры пришедшие с запросом
 *    pass  - пароль
 *    login - логин
 * @param {Client} client клиент совершающий действие
 */
SiteController.prototype.register = function ( params, client ) {
  var self = this;
  params.pass = crypto.createHash('md5').update( params.pass ).digest("hex");

  // проверяем существует ли указанный логин
  this.models.user.exists( 'login=:login', {
    login : params.login
  } )
    .on( 'error', client.send_error.bind( client ) )  // 500 ошибка
    .on( 'success', function( user_exists ) {
      // если логин уже занят - отправляем главную страницу с показом ошибки
      if( user_exists ) return self.index( null, client, 'This login already in use' );

      // если нет создаем модель пользователя
      var user = new self.models.user;

      // задаем ей параметры ( зададутся только параметры указанные в User.get_safe_attributes )
      user.set_attributes( params );

      // сохраняем
      user.save()
        .on( 'error', client.send_error.bind( client ) )      // 500 ошибка
        .on( 'validation_error', function( errors ){
          // не пройдена валидация
          self.index( null, client, errors.join('<br/>') );
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
    this.index.bind( this, null, client, 'Wrong email or/and password' )  // показ ошибки на главной
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
 *
 *
 * @param login
 * @param pass
 * @param client
 * @param success
 * @param fail
 */
SiteController.prototype._authorize = function ( login, pass, client, success, fail ) {
  var self = this;
  return this.models.user.find_by_attributes( {
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
    .on( 'validation_error', function( errors ){
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
        .on( 'validation_error', function( errors ){
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