module.exports = User.inherits( require('./json') );

/**
 * Контроллер отвечающий за действия с пользователем
 *
 * @param params
 * @extends Json
 * @constructor
 */
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

  // если нет необходимых параметров, то не стоит даже пытаться авторизовать пользователя
  if ( !user || !user.login || !user.pass )
    return response.send( new Error('Bad params'), 500 );

  // ищем пользователя по логину и паролю
  listener.stack <<= this.models.user.find_by_attributes({
    login : user.login,
    pass  : user.pass.md5()
  });

  listener.success(function( user ){
    // если такой пользователь найден, авторизуем его при помощи компонента users
    if ( user ) {
      // так как указан третий параметр, клиенту будут записаны специальные куки, чтобы впоследствии
      // производить по ним авторизацию (см. контроллер Site.connect_client)
      self.app.users.login( user, request, 356 );

      // а также отправляем результат со ссылкой на главную страницу
      response.view_name('main').send({ result : self.create_url('site.index') });
    }

    // иначе отправляем представление json/user.json с ошибками которые будут показаны в форме
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
  // производим выход пользователя при помощи компонента users
  this.app.users.logout( request );

  // так как это обычный запрос пришедший не по ajax просто редиректим пользователя на главную страницу
  request.redirect( this.create_url('site.index'));
};


/**
 * Регистрация
 */
User.prototype.register = function ( response, request ) {
  var self      = this;
  var listener  = response.create_listener();
  var params    = request.params.user;

  // если нет необходимых параметров, то не стоит даже пытаться регистрировать
  if ( !params || !params.login || !params.pass )
    return response.send( new Error('Bad params'), 500 );

  // проверяем существует ли указанный логин
  listener.stack <<= this.models.user.exists( 'login=:login', {
    login : params.login
  });

  listener.success(function( user_exists ){
    // задаем представление json/user.json через которое можно отправить ошибки, которые будут показаны в форме
    response.view_name('user');

    // если логин уже занят - отправляем ошибку для показа в форме
    if( user_exists ) return response.send({
      errors : {
        login : 'This login already in use'
      }
    });

    // если нет - создаем модель пользователя
    var user = new self.models.user( params );

    // сохраняем пользователя, если он не пройдет валидацию, будет вызван Json.validation_error
    listener.stack <<= user.save();
    listener.success( function(){
      // если сохранение прошло успешно - сразу же осуществляем вход пользователя через компонент users
      self.app.users.login( user, request, 365 );

      // и отправляем информацию о том что надо перенаправить клиент на главную страницу
      return response.view_name('main').send({
        result : self.create_url('site.index')
      });
    });
  });
};
