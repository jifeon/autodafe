var url = require('url');

module.exports = Query.inherits( autodafe.AppModule );


/**
 * Класс описывающий запрос от какого-либо клиента
 *
 * Для создания экземпляра лучше пользвоаться методом {@link Client.query}
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params см. {@link Query._init}
 */
function Query( params ) {
  this._init( params );
}


/**
 * Инициализация запроса
 *
 * @private
 * @param {Object} params параметры для инициализации, см. также {@link AppModule._init} При использовании
 * {@link Client.create_query} ссылку на приложение {@link AppModule.app} в параметрах передавать не надо
 * @param {Client} [params.client] клиент инициализирующий запрос, при пользовании {@link Client.create_query}
 * подставляется автоматически
 * @param {String} [params.connection_type] тип подключения клиента, возможные значения задаваемые {@link HTTPClient} и
 * {@link WebSocketsClient}: "post", "get", "delete", "ws"
 * @param {Route} [params.route=null] мрашрут, к которому привязан данный запрос, todo: remove
 * @param {String} [params.host=''] хост на который пришел запрос
 * @param {String} [params.url=''] урл
 * @param {String} [params.action] действие вызываемое запросом
 * @param {Object} [params.params] параметры запроса
 */
Query.prototype._init = function( params ) {
  Query.parent._init.call( this, params );

  /**
   * Клиент инициализирующий запрос
   *
   * @type {Client}
   */
  this.client          = params.client;

  /**
   * тип подключения клиента, возможные значения задаваемые {@link HTTPClient} и {@link WebSocketsClient}: "post",
   * "get", "delete", "ws"
   *
   * @type {String}
   */
  this.connection_type = params.connection_type;

  //todo: remove
  this.route           = params.route  || null;

  /**
   * хост на который пришел запрос
   *
   * @type {String}
   */
  this.host            = params.host   || '';

  /**
   * УРЛ на который пришел запрос, если передан в параметрах, то спереди к нему добавляется {@link Query.host}
   *
   * @type {String}
   */
  this.url             = params.url ? '//' + this.host + params.url : '';

  /**
   * Распаршенный (url.parse) УРЛ
   *
   * @type {Object}
   */
  this.parsed_url      = url.parse( this.url, true, true );

  /**
   * действие вызываемое запросом, если не задано в параметрах, берется из УРЛ
   *
   * @type {String}
   */
  this.action          = params.action || this.parsed_url.pathname;

  /**
   * параметры запроса, если не заданы в параметрах, берутся из УРЛ
   *
   * @type {Object}
   */
  this.params          = params.params || this.parsed_url.query;
};