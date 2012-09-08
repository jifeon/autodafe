var Controller  = global.autodafe.Controller;
var crypto      = require('crypto');

module.exports = Site.inherits( Controller ); // наследуем от Controller

/**
 * Единственный в данном приложении контроллер, который и отвечает за логику работы приложения
 *
 * @constructor
 * @extends Controller
 * @param {Object} params
 */
function Site( params ) {
  this._init( params );

  this.POSTS_PER_PAGE = 5;

  this.behavior_for( 'not_valid', this.validation_error );
}


Site.prototype.validation_error = function( response, request, errors ){
  response.merge_params({ errors : {
    reg : errors
  }});

  this.action( 'index', response, request);
}


/**
 * Возвращает параметры которые доступны во всех шаблонах
 *
 * @param {Response} response
 * @param {Request} request
 * @return {Object}
 */
Site.prototype.global_view_params = function( response, request ){
  var ui = this.app.users.get_by_client( request.client );

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
Site.prototype.connect_client = function ( client ){

  // Для начала достанем специальный объект UserIdentity привязанный к текущему пользователю
  var ui = this.app.users.get_by_client( client );

  // проверяем не авторизован ли уже наш клиент
  if ( !ui.is_guest() ) return true;

  // если не авторизован считываем параметры для авторизации из cookie
  var login = client.get_cookie( 'blog_login' );
  var pass  = client.get_cookie( 'blog_pass' );

  // если их нет, даже не пытаемся авторизоваться
  if ( !login || !pass ) return false;

  // иначе производим авторизацию
  return this._authorize( login, pass, client );
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
Site.prototype._authorize = function ( login, pass, client, success, fail ) {
  var emitter = new process.EventEmitter;

  var self = this;
  this.models.user.find_by_attributes( {
    login : login,
    pass  : pass
  } )
    .on( 'error', client.send_error.bind( client ) )
    .on( 'success', function( user ){
      if ( !user ) {
        if (typeof fail == 'function') fail();
        else emitter.emit('success');
        return false;
      }

      self._login_client( client, user );
      if ( typeof success == 'function' ) success();
      else emitter.emit('success');
    } );

  return emitter;
};


Site.prototype._login_client = function ( client, user ) {
  this.app.users.authorize_session( client.session, user );

  client.set_cookie( 'blog_login',  user.login, 365 );
  client.set_cookie( 'blog_pass',   user.pass,  365 );
};


Site.prototype._logout_client = function ( client ) {
  this.app.users.logout_session( client.session );

  client.set_cookie( 'blog_login',  '' );
  client.set_cookie( 'blog_pass',   '' );
};


/**
 * Главная страница сайта. Этот метод указан в секции router.rules конфигурационного файла для корня сайта
 *
 * @param {Response} response Ответ, который будет отправлен клиенту
 * @param {Request} request Запрос, инициировавший действие
 */
Site.prototype.index = function ( response, request ) {
  var pages = this.create_widget( 'pages', {
    items_per_page : this.POSTS_PER_PAGE,
    action_path    : 'site.index',
    current_page   : request.params.page,
    view           : 'table'
  } );

  response.merge_params({
    posts   : this.models.post.find_all({
      offset : pages.current_page * this.POSTS_PER_PAGE,
      limit  : this.POSTS_PER_PAGE,
      order  : 'date desc'
    }),
    pages   : pages
  });

  response
    .create_listener()
    .handle_emitter( this.models.post.count() )
    .success(function( count ){
      pages.count = count;
      response.send();
    });
};


/**
 * Регистрация
 */
Site.prototype.register = function ( response, request ) {
  var self      = this;
  var listener  = response.create_listener();

  // проверяем существует ли указанный логин
  listener.stack <<= this.models.user.exists( 'login=:login', {
    login : request.params.login
  });

  listener.success(function( user_exists ){
    // если логин уже занят - отправляем главную страницу с показом ошибки
    if( user_exists ) {
      response.merge_params({ errors : {
        reg : { login : 'This login already in use' }
      }});

      return self.action( 'index', response, request );
    }

    // если нет - создаем модель пользователя
    var user = new self.models.user;

    // задаем ей параметры и сохраняем
    listener.stack <<= user.set_attributes( request.params ).save();
    listener.success( function(){
      // логиним клиент
      self._login_client( request.client, user );

      // и редиректим его на главную
      request.redirect('/');
    });
  });
};


/**
 * Запрос на вход пользователя
 */
Site.prototype.login = function ( response, request ) {
  var client  = request.client;
  var self    = this;

  // пытаемся авотризовать клиента
  this._authorize(
    request.params.login,
    crypto.createHash('md5').update( request.params.pass ).digest("hex"),
    client,
    client.redirect.bind( client, '/' ),    // успешно авторизован - редирект на главную
    function(){                             // показ ошибки на главной
      response.merge_params({ errors : {
        login : {login : 'Wrong login or/and password'}
      }});

      self.action( 'index', response, request );
    }
  );
};


/**
 * Запрос на выход пользователя
 */
Site.prototype.logout = function ( response, request ) {
  this._logout_client( request.client );
  request.redirect( '/' );
};


/**
 * Создание топика
 */
Site.prototype.create_topic = function ( response, request ) {
  if ( request.params.name == null ) return response.send();

  var ui    = this.app.users.get_by_client( request.client );
  if ( ui.is_guest() ) return response.send( new Error('Only users can add comments'), 403 );

  var self  = this;
  var post  = new this.models.post( request.params );
  post.user_id = ui.model.id;

  response
    .create_listener()
    .handle_emitter( post.save() )
    .success(function(){
      request.redirect( self.create_url( 'view_topic', { topic_id : post.id }));
    })
    .behavior_for( 'not_valid', function( errors ){
      response.send({
        error : Object.values( errors ).join('<br/>')
      });
    })
};


/**
 * Просмотр топика
 */
Site.prototype.view_topic = function ( response, request ) {
  var listener = response.create_listener();
  listener.stack <<= this.models.post.With( 'author', 'comments.commenter' ).find_by_pk( request.params.topic_id );
  listener.success(function( topic ){
    if ( !topic ) return response.send( new Error('Topic not found'), 404 );

    response.send({ topic : topic });
  });
};


/**
 * Добавление комментария
 */
Site.prototype.comment = function ( response, request ) {
  var ui        = this.app.users.get_by_client( request.client );
  if ( ui.is_guest() ) return response.send( new Error('Only users can add comments'), 403 );

  var self      = this;
  var listener  = response.create_listener();
  listener.stack <<= this.models.post.find_by_pk( request.params.post_id );
  listener.success(function( topic ){
    if ( !topic ) return response.send( new Error('Topic not found'), 404 );

    var comment     = new self.models.comment( request.params );
    comment.post_id = topic.id;
    comment.user_id = ui.model.id;
    listener
      .handle_emitter( comment.save() )
      .success( function(){
        request.redirect( self.create_url( 'view_topic', { topic_id : topic.id }));
      })
      .behavior_for( 'not_valid', function( errors ){
        response.view_name('view_topic').send({
          topic : topic,
          error : Object.values( errors ).join('<br/>'),
          text  : request.params.text
        });
      });
  })
};