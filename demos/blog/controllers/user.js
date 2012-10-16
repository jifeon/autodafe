module.exports = User.inherits( require('./json') );

function User( params ){
  this._init( params );
}


/**
 * Запрос на вход пользователя
 */
User.prototype.login = function ( response, request ) {
  var self = this;
  var listener = response.create_listener();
  var user     = request.params.user;

  listener.stack <<= this.models.user.find_by_attributes({
    login : user && user.login,
    pass  : user && user.pass && user.pass.md5()
  });

  listener.success(function( user ){
    if ( user ) {
      self.app.users.login( user, request, 356 );
      response.view_name('main').send({ result : self.create_url('site.index') });
    }

    else response.view_name('user').send({
      errors : {
        login : 'Wrong login',
        pass  : 'or password'
      }
    });
  });
};


/**
 * Запрос на выход пользователя
 */
User.prototype.logout = function ( response, request ) {
  this.app.users.logout( request );
  request.redirect( this.create_url('site.index'));
};


/**
 * Регистрация
 */
User.prototype.register = function ( response, request ) {
  var self      = this;
  var listener  = response.create_listener();
  var params    = request.params.user;

  response.view_name('user');

  // проверяем существует ли указанный логин
  listener.stack <<= this.models.user.exists( 'login=:login', {
    login : params && params.login
  });

  listener.success(function( user_exists ){
    // если логин уже занят - отправляем главную страницу с показом ошибки
    if( user_exists ) return response.send({
      errors : {
        login : 'This login already in use'
      }
    });

    // если нет - создаем модель пользователя
    var user = new self.models.user( params );

    // сохраняем
    listener.stack <<= user.save();
    listener.success( function(){
      // логиним
      self.app.users.login( user, request, 365 );

      // и редиректим его на главную
      return response.view_name('main').send({
        result : self.create_url('site.index')
      });
    });
  });
};
