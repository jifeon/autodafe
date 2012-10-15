module.exports = User.inherits( require('./json') );

function User( params ){
  this._init( params );
}


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
 * Регистрация
 */
User.prototype.register = function ( response, request ) {
  var self      = this;
  var listener  = response.create_listener();

  // проверяем существует ли указанный логин
  listener.stack <<= this.models.user.exists( 'login=:login', {
    login : request.params.user.login
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
User.prototype.login = function ( response, request ) {
  var self = this;
  var listener = response.create_listener();

  listener.stack <<= this.models.user.find_by_attributes( request.params.user );
  listener.success(function( user ){
    if ( user ) self.app.users.login( user, request );
    else response.merge_params({
      'error' : 'Authorization failed. Wrong username or password'
    });

    response.view_name('index').send();
  });
};


/**
 * Запрос на выход пользователя
 */
User.prototype.logout = function ( response, request ) {
  this.app.users.logout( request );
  request.redirect( '/' );
};