module.exports = Request.inherits( global.autodafe.AppModule );


/**
 * Класс, описывающий запрос от какого-либо клиента
 *
 * Для создания экземпляра удобно пользоваться методом {@link Client.create_request}
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params параметры для инициализации
 * @param {Client} [params.client] клиент инициирующий запрос
 * @param {String} [params.type="internal"] тип подключения клиента
 * @param {String} [params.action=""] действие вызываемое запросом
 * @param {Object} [params.params={}] параметры запроса
 */
function Request( params ) {
  this._init( params );
}


/**
 * Инициализация запроса
 *
 * @private
 * @param {Object} params см. конструктор {@link Request}
 */
Request.prototype._init = function( params ) {
  Request.parent._init.call( this, params );

  /**
   * Клиент инициирующий запрос
   *
   * @type {Client}
   */
  this.client = params.client;

  /**
   * Тип подключения клиента, возможные значения задаваемые {@link HTTPClient} и {@link WebSocketsClient}: "post",
   * "get", "delete", "update", "ws", и "internal" для внутренних запросов
   *
   * @type {String}
   * @default "internal"
   * @see Router._init
   */
  this.type   = params.type || 'internal';

  /**
   * Действие, вызываемое запросом
   *
   * При маршрутизации запроса будет сравниваться с ключами config.router.rules
   *
   * @type {String}
   */
  this.action = params.action || '';

  /**
   * Параметры запроса
   *
   * @type {Object}
   */
  this.params = params.params || {};


  /**
   * Текущий пользователь
   *
   * Если подключен компонент users ({@link UsersManager}), то в это свойство будет записываться экземпляр
   * {@link UserIdentity}, ассоциированный с текущим пользователем
   *
   * @type {UserIdentity|null}
   */
  this.user = null;
};