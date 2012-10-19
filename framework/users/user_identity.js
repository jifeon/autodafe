var UserIdentityModelHandler  = require('./user_identity_model_handler');
var UserIdentityARHandler     = require('./user_identity_active_record_handler');

module.exports = UserIdentity.inherits( global.autodafe.AppModule );


/**
 * Клас хранящий информацию о пользователе
 *
 * Этот класс является неотъемлемой частью компонента <code>users</code>, реализуемого классом {@link UsersManager}
 *
 * Экземпляр этого класса является ассоциацией с реальным пользователем. Один пользователь, подключившийся с различных
 * устройств по различным протоколам к приложению, будет ссылаться на один и тотже {@link UserIdentity}. Получить ссылку
 * на текущего пользователя из действия контроллера всегда можно через {@link Request.user}. Также для этого должна быть
 * реализована правильная авторизвция пользователя через метод {@link UsersManager.login}
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params параметры для инициализации
 * @param {UsersManager} params.users_manager ссылка на менеджер пользователей
 */
function UserIdentity( params ) {
  return this._init( params );
}


/**
 * Инициализация UserIdentity
 *
 * @param params см. конструктор {@link UserIdentity}
 * @private
 */
UserIdentity.prototype._init = function( params ) {
  UserIdentity.parent._init.call( this, params );

  /**
   * Ссылка на менеджер пользователей
   *
   * @type {UsersManager}
   */
  this.users_manager  = params.users_manager;

  /**
   * Сессии, которые относятся к данному пользователю
   *
   * Для добавления и удаления сессий у пользователя необходимо пользоваться методами
   * {@link UserIdentity.register_session} и {@link UserIdentity.remove_session} соответственно
   *
   * @type {Session[]}
   */
  this.sessions       = [];

  /**
   * Модель, ассоциированная с этим пользователем
   *
   * @type {null}
   */
  this._.model        = null;

  /**
   * Признак того, является ли данный пользователь гостем
   *
   * @field
   * @name guest
   * @type {Boolean}
   */
  this._.guest.get    = function(){
    return this.is_guest();
  }
};


/**
 * Привязывает новую сессию к данному ползователю
 *
 * @param {Session} session
 * @return {UserIdentity} this
 */
UserIdentity.prototype.register_session = function ( session ) {
  if ( ~this.sessions.indexOf( session ) ) {
    this.log( 'Try to register same session', 'warning' );
    return this;
  }

  this.sessions.push( session );
  var self = this;
  session.once( 'close', function() {
    self.remove_session( session );
  });

  return this;
};


/**
 * Удаляет привязку сесии к пользователю
 *
 * @param {Session} session
 * @return {UserIdentity} this
 */
UserIdentity.prototype.remove_session = function ( session ) {
  var cid = this.sessions.indexOf( session );
  if ( cid != -1 ) this.sessions.splice( cid, 1 );

  return this;
};


/**
 * Возвращает true если пользователь гость
 *
 * @return {Boolean}
 */
UserIdentity.prototype.is_guest = function () {
  return this == this.users_manager.guests;
};


/**
 * Возвращает true если пользователь авторизован
 *
 * @return {Boolean}
 */
UserIdentity.prototype.is_authorized = function(){
  return !this.is_guest();
};


/**
 * Привязывает модель к пользователю
 *
 * К {@link UserIdentity} относящемосю к гостям нельзя привязать модель
 *
 * @param {Model} model
 * @return {Boolean}
 */
UserIdentity.prototype.set_model = function ( model ) {
  if ( this.is_guest() ) {
    this.log( 'Try to set model for guests UserIdentity', 'error' );
    return this;
  }

  this._.model = model;
  return this;
};


/**
 * Метод для проверки возможности выполнения действия
 *
 * Возможность выполнения действия определяется в связи с правами ролей пользователей, описанными как в конфигурационном
 * файле, так и относительно каждой модели в файлах моделей.
 *
 * @param {String} action название действиия, возможность которого проверяется
 * @param {Model} [model] модель над которой совершается действие
 * @param {String} [attribute] атрибут модели над которым совершается действие
 * @param {Object} [params] дополнительные параметры для определения роли пользователя
 * @return {Boolean} true - пользователь может совершить данное действие, false - нет
 * @example <pre><code class="javascript">
 * request.user.can( 'create', this.models.comment );
 * </code></pre>
 */
UserIdentity.prototype.can = function ( action, model, attribute, params ) {
  return this.users_manager.check_right( this, action, model, attribute, params );
};


/**
 * Возвращает список ролей к которым относится пользователь
 *
 * Единовременно у пользователя может быть несколько ролей. Например он может быть зарегистрированным пользователем, а
 * также автором относительно проверяемой модели.
 *
 * @param {Model} [model] модель относительно которой выясняются роли пользователя
 * @param {String} [attribute] конкретный атрибут этой модели
 * @param {Object} [params] дополнительные параметры для выяснения роли
 * @return {String[]}
 */
UserIdentity.prototype.get_roles = function ( model, attribute, params ) {
  return this.users_manager.get_roles( this, model, attribute, params );
};


// todo: оптимизировать метод
/**
 * Проверка на пренадлежность пользователя конкретной роли
 *
 * @param {String} role роль на принадлежност которой производится проверка
 * @param {Model} [model] модель относительно которой производится определении роли
 * @param {String} [attribute] конкретный атрибут модели
 * @param {Object} [params] дополнительные параметры для определения роли
 * @return {Boolean} true если пользователь принадлежит переданной роли, false если нет
 */
UserIdentity.prototype.is = function( role, model, attribute, params ){
  return !!~this.get_roles( model, attribute, params).indexOf( role );
}


/**
 * Специальный метод для передачи модели "во владение пользователя"
 *
 * После этой опреации любый действия над моделью и ее атрибутами будут строго следовать таблице прав ролей
 *
 * @param {Model|EventEmitter} model модель или EventEmitter который вызовет действие success с моделью в параметрах
 * @param {Object} [params] дополнительные правила для определение роли пользователя
 * @return {Proxy} от {@link UserIdentityModelHandler} или {@link UserIdentityARHandler}
 */
UserIdentity.prototype.manage = function ( model, params ) {
  var EE   = process.EventEmitter;
  var self = this;
  if ( model.constructor == EE ) {
    var emitter = new EE;

    model
      .on('success', function( result ){
        emitter.emit('success', self.manage( result, params ));
      })
      .re_emit('error', emitter);

    return emitter;
  }

  if ( Array.isArray( model ) ) return model.map( function( model ) {
    return this.manage( model, params );
  }, this );

  if ( !global.autodafe.Model.is_instantiate( model ) ) return model;
  var Handler = model.class_name == 'ActiveRecord' ? UserIdentityARHandler : UserIdentityModelHandler;

  var handler = new Handler({
    target        : model,
    user_identity : this,
    params        : params
  });

  return handler.get_proxy();
};


/**
 * Признак того что пользователь "онлайн"
 *
 * Пока существует хоть одна сессия для данного пользователя, он считается онлайн. См. <code>session_live_time</code>
 * в {@link Application}
 *
 * @return {Boolean}
 */
UserIdentity.prototype.is_online = function(){
  return !!this.sessions.length;
};