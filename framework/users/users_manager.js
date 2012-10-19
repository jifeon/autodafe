module.exports = UsersManager.inherits( global.autodafe.Component );

/**
 * Компонент для работы с пользователями
 *
 * Компонент реализует привязку моделей пользователей к настоящим пользователям. Для каждого реального пользователя
 * создается специальный экземпляр {@link UserIdentity}, к которому привязываются все сессии конкретного пользователя
 * после его авторизации. Такдже компонент обеспечивает работу системы прав ролей.
 *
 * Изначальна все сессии попадают в {@link UserIdentity} хранящееся в {@link UsersManager.guest}. Когда же они
 * авторизовываются, они либо попадают в уже существующий {@link UserIdentity} для пользователя, либо же для них
 * создается новый {@link UserIdentity}
 *
 * @constructor
 * @extends Component
 * @param {Object} params параметры для инициализации
 * @param {String} params.model название модели, с которой у приложения будут ассоцироваться пользователи
 * @param {Object} params.roles хэш в котором описаны роли пользователей
 * @param {Object} params.roles_groups группы пользователей, используются для сокращения записи прав
 * @param {Object} params.rights глобальные права пользователей, котое могут быть легко изменены относительно каждой
 * модели или даже ее аттрибута
 * @example <pre><code class="javascript">
 * module.exports = {
 *   //...
 *
 *   components : {
 *     //...
 *
 *     users : {
 *       model : 'user',
 *
 *       roles : {
 *         user      : 'user.id != null',
 *         moderator : 'user.status == "moderator"',
 *         admin     : function( user, app, model, attribute ) {
 *           return ~app.params['admin_ids'].indexOf( user.id );
 *         }
 *       },
 *
 *       roles_groups : {
 *         all : 'admin, user, guest, moderator'
 *       },
 *
 *       rights : {
 *         create  : 'all, -guest',
 *         view    : 'all',
 *         edit    : 'admin',
 *         remove  : 'admin'
 *       }
 *     }
 *   }
 * }
 * </code></pre>
 */
function UsersManager( params ) {
  this._init( params );
}


/**
 * Инициализация UsersManager
 *
 * @param params см. конструктор {@link UsersManager}
 * @private
 */
UsersManager.prototype._init = function( params ) {
  UsersManager.parent._init.call( this, params );

  /**
   * В этом объекте содержатся права пользователя
   *
   * Как глобальные так и относительно каждой модели
   *
   * @type {Object}
   * @property {RolesSet} global хранилище глобальных прав
   * @property {Object} models в этом объекте хранятся права относительно каждой модели. Ключи - имена моделей,
   * значения - экземпляры {@link ModelsRolesSet}
   */
  this.rights = {
    global : null,
    models : {}
  };

  this._init_roles( params );

  /**
   * Индексы для поиска нужного {@link UserIdentity}
   *
   * @type {Object}
   * @private
   * @property {Object} by_session_id для поиска по {@link Session}
   * @property {Object} by_model_id для поиска по {@link Model}
   * @see UsersManager.get_by_session
   * @see UsersManager.get_by_model
   */
  this._users = {
    by_session_id : {},
    by_model_id   : {}
  };

  /**
   * {@link UserIdentity} для всех неавторизованнызх пользователей
   *
   * @type {UserIdentity}
   */
  this._.guests = new global.autodafe.users.UserIdentity({
    app           : this.app,
    users_manager : this
  });

  /**
   * Название модели, ассоциирующейся с пользователями
   *
   * @type {String}
   */
  this.user_model = params.model;

  var self = this;
  this.app.on( 'new_session', this._register_guest_session.bind( this ));

  this.app.on('ready', function(){
    self.app.http && self.app.http.on( 'receive_request', function( request ){
      request.user = self.get_by_request( request );
    });

    self.app.ws && self.app.ws.on( 'receive_request', function( request ){
      request.user = self.get_by_request( request );
    });
  })
};


/**
 * Инициализирует таблицу ролей
 *
 * @param params см. params в {@link UsersManager}
 * @private
 */
UsersManager.prototype._init_roles = function ( params ) {
  this.rights.global = new global.autodafe.users.RolesSet( params );

  this.app.models.for_each_model( function( model ){
    var models_roles        = typeof model.users_rights == 'function' ? model.users_rights() || {} : {};
    models_roles.app        = this.app;
    models_roles.parent_set = this.rights.global;
    this.rights.models[ model.class_name ] = new global.autodafe.users.ModelsRolesSet( models_roles );
  }, this );
};


/**
 * Проверяет возможность выполнения действия определенным {@link UserIdentity}
 *
 * @param {UserIdentity} user_identity
 * @param {String} action название действиия, возможность которого проверяется
 * @param {Model} [model] модель над которой совершается действие
 * @param {String} [attribute] атрибут модели над которым совершается действие
 * @param {Object} [params] дополнительные параметры для определения роли пользователя
 * @return {Boolean} true если пользователь может выпонить действие
 */
UsersManager.prototype.check_right = function ( user_identity, action, model, attribute, params ) {
  var roles_set = this._get_roles_set( model );
  return roles_set.check_right( user_identity, action, model, attribute, params );
};


/**
 * Возвращает список ролей к которым относится пользователь
 *
 * Единовременно у пользователя может быть несколько ролей. Например он может быть зарегистрированным пользователем, а
 * также автором относительно проверяемой модели.
 *
 * @param {UserIdentity} user_identity
 * @param {Model} [model] модель над которой совершается действие
 * @param {String} [attribute] атрибут модели над которым совершается действие
 * @param {Object} [params] дополнительные параметры для определения роли пользователя
 * @return {String[]}
 */
UsersManager.prototype.get_roles = function ( user_identity, model, attribute, params ) {
  var roles_set = this._get_roles_set( model );
  return roles_set.get_roles( user_identity, model, attribute, params );
};


/**
 * Возвращает {@link RolesSet} подходящий для модели
 *
 * Либо глобальный {@link RolesSet}
 *
 * @param {Model} [model]
 * @return {RolesSet}
 * @private
 */
UsersManager.prototype._get_roles_set = function ( model ) {
  return model ? this.rights.models[ model.class_name ] : this.rights.global;
};


/**
 * Регистрирует сессию неавторизованного пользователя
 *
 * Сначала все сессии попадают именно в {@link UserIdentity} гостя
 *
 * @param {Session} session
 * @private
 */
UsersManager.prototype._register_guest_session = function ( session ) {
  if ( !session.is_active ) {
    this.log( 'Can\'t create UserIdentity for closed session', 'warning' );
    return false;
  }

  var users = this._users;
  if ( users.by_session_id[ session.id ] ) {
    this.app.log( 'Try to register double guest session (id=%s)'.format( session.id ), 'warning' );
    return false;
  }

  users.by_session_id[ session.id ] = this.guests.register_session( session );

  session.once( 'close', function() {
    delete users.by_session_id[ session.id ];
  });
};


/**
 * Возвращает {@link UserIdentity} для переданной сессии
 *
 * @param {Session} session
 * @return {UserIdentity}
 */
UsersManager.prototype.get_by_session = function ( session ) {
  return this._users.by_session_id[ session.id ] || null;
};


/**
 * Возвращает {@link UserIdentity} для переданного клиента
 *
 * @param {Client} client
 * @return {UserIdentity}
 */
UsersManager.prototype.get_by_client = function ( client ) {
  return this.get_by_session( client.session );
};


/**
 * Возвращает {@link UserIdentity} для переданного запроса
 *
 * @param {Request} request
 * @return {UserIdentity}
 */
UsersManager.prototype.get_by_request = function( request ){
  return this.get_by_client( request.client );
}


/**
 * Возвращает {@link UserIdentity} для переданной модели
 *
 * @param {Model} model
 * @return {UserIdentity}
 */
UsersManager.prototype.get_by_model = function ( model ) {
  return this.get_by_model_id( model.get_id() );
};


/**
 * Возвращает {@link UserIdentity} для переданного идентификатора модели
 *
 * @param {*} id
 * @return {UserIdentity|null}
 */
UsersManager.prototype.get_by_model_id = function ( id ) {
  return this._users.by_model_id[ JSON.stringify(id) ] || null;
};


/**
 * Вход пользователя
 *
 * @param {Model} model модель пользователя, которого авторизуем
 * @param {Request} request запрос который вызвал авторизацию
 * @param {Number} [cookie_days] если указан - то на такое число дней запишутся куки для авторизации пользователя
 */
UsersManager.prototype.login = function( model, request, cookie_days ){
  request.user = this.authorize_session( request.client.session, model );

  var id = model.get_id();
  if ( typeof cookie_days != 'undefined' && id != null && typeof model.cookie_hash == 'function' ) {
    request.client.set_cookie( 'autodafe_id', JSON.stringify( id ), cookie_days);
    request.client.set_cookie( 'autodafe_hash', model.cookie_hash(), cookie_days);
  }
}


/**
 * Выход пользователя
 *
 * @param {Request} request запрос вызвавший выход
 */
UsersManager.prototype.logout = function( request ){
  this.logout_session( request.client.session );
  request.user = this.guests;
  request.client.set_cookie( 'autodafe_id', '');
  request.client.set_cookie( 'autodafe_hash', '');
}


/**
 * Логин клиента по куки
 *
 * Удобно использовать этот метод в {@link Controller.connect_client}
 *
 * @param {Client} client клиент которого надо попробовать залогинить
 */
UsersManager.prototype.login_by_cookie = function( client ){
  var ui = this.get_by_client( client );
  if ( ui.is_authorized() ) return;

  var id = client.get_cookie( 'autodafe_id' );
  if ( !id ) return;

  try{
    id = JSON.parse(id);
  }
  catch (e){
    this.log( 'Authorization by cookie failed. Bad id', 'warning' );
    return;
  }

  var emitter = new process.EventEmitter;

  var model = this.app.models[ this.user_model ];
  if ( !model ) {
    this.log( 'Authorization by cookie failed. You must specify exiting `components.users.model` in config file', 'warning' );
    return;
  }

  var self = this;
  model.find_by_pk( id )
    .on( 'error', function( e ){
      self.log( 'Authorization by cookie failed. System error while user search', 'warning' );
      process.nextTick( emitter.emit.bind( emitter, 'error', e ));
    } )
    .on( 'success', function( user ){
      if ( !user )
        self.log( 'Authorization by cookie failed. User not found', 'warning' );

      else if ( typeof user.cookie_hash != 'function' || user.cookie_hash() != client.get_cookie('autodafe_hash'))
        self.log( 'Authorization by cookie failed. Wrong cookie hash', 'warning' );

      else {
        self.authorize_session( client.session, user );
        self.log( 'User authorized', 'info' );
      }

      process.nextTick( emitter.emit.bind( emitter, 'success' ));
    })

  return emitter;
}


/**
 * Авторизует конкретную сессию
 *
 * @param {Session} session сессия, которую надо авторизовать
 * @param {Model} model модель пользователя
 * @return {UserIdentity}
 */
UsersManager.prototype.authorize_session = function ( session, model ) {
  var guests_ui = this.get_by_session( session );
  if ( guests_ui && guests_ui != this.guests ) {
    if ( guests_ui.model != model ) this.logout_session( session );
    else {
      this.log( 'Try to double authorize session with id = %s'.format( session.id ), 'warning' );
      return guests_ui;
    }
  }

  if ( guests_ui ) guests_ui.remove_session( session );

  var ui = this.get_by_model( model );

  if ( !ui ){
    ui = new global.autodafe.users.UserIdentity({
      app           : this.app,
      users_manager : this
    });

    ui.set_model( model );
    this._users.by_model_id[ JSON.stringify( model.get_id())] = ui;
  }

  this._users.by_session_id[ session.id ] = ui.register_session( session );

  var self = this;
  // if user did not was in guests we should add handler on session close
  if ( !guests_ui ) session.once( 'close', function() {
    delete self._users.by_session_id[ session.id ];
  } );

  return ui;
};


/**
 * Разавторизовывает сессию
 *
 * @param {Session} session
 * @return {UserIdentity} {@link UsersManager.guests}
 */
UsersManager.prototype.logout_session = function ( session ) {
  var ui = this.get_by_session( session );
  if ( ui == this.guests ) {
    this.log( 'Try to log out by guest. Session id = %s'.format( session.id ), 'warning' );
    return ui;
  }

  if ( ui ) ui.remove_session( session );

  this._users.by_session_id[ session.id ] = this.guests.register_session( session );

  var self = this;
  if ( !ui ) session.once( 'close', function() {
    delete self._users.by_session_id[ session.id ];
  } );

  return this.guests;
};