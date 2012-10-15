var crypto      = require('crypto');
var less        = require('less');
var fs          = require('fs');
var path        = require('path');

// наследуем от Controller
module.exports = Site.inherits( global.autodafe.Controller );

/**
 * Единственный в данном приложении контроллер, который и отвечает за логику работы приложения
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

  this.POSTS_PER_PAGE = 5;

  this.behavior_for( 'not_valid', this.validation_error );

  this.app.on( 'views_are_loaded', this._compile_templates.bind( this ) );
  if ( this.app.views_loaded ) this._compile_templates();

}

Site.prototype._compile_templates = function(){
  var style = fs.readFileSync( path.join( this.app.base_dir, 'static/css/style.less' ), 'utf8' );
  var parser = new less.Parser({
    paths: [ path.join( this.app.base_dir, '../../node_modules/twitter-bootstrap/less/' ) ]//, // Specify search paths for @import directives
//      filename: 'style.less' // Specify a filename, for better error messages
  });

  var self = this;
  parser.parse( style, function (e, tree) {
    var css = tree.toCSS({ compress: true }); // Minify CSS output
    var css_file = path.join( self.app.base_dir, 'static/css/style.css' );
    if ( fs.existsSync( css_file ) ) fs.unlinkSync( css_file );
    var fd = fs.openSync( css_file, 'a', 0666 );
    fs.writeSync( fd, css, null, 'utf8' );
    fs.closeSync( fd );
  });
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