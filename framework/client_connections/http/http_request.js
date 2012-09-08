var url = require('url');

module.exports = HTTPRequest.inherits( global.autodafe.cc.Request );


/**
 * Класс описывающий запрос от HTTP клиента
 *
 * Для создания экземпляра удобнее пользоваться методом {@link HTTPClient.create_request}
 *
 * @constructor
 * @extends Request
 * @param {Object} params параметры для инициализации
 * @param {http.ServerRequest} params.request
 */
function HTTPRequest( params ) {
  this._init( params );
}


/**
 * Инициализация запроса
 *
 * @private
 * @param {Object} params см. {@link HTTPRequest}
 */
HTTPRequest.prototype._init = function( params ) {
  HTTPRequest.parent._init.call( this, params );

  if ( !params.request ) throw new Error( '`request` is required option for HTTPRequest' );

  /**
   * nodejs http запрос
   *
   * @type {http.ServerRequest}
   */
  this.original_request = params.request;

  /**
   * HTTP метод "post", "delete", "get" или "update"
   *
   * @type {String}
   */
  this.method     = this.original_request.method.toLocaleLowerCase();

  /**
   * Хост, на который пришел запрос
   *
   * @type {String}
   */
  this.host       = this.original_request.headers.host;

  /**
   * УРЛ на который пришел запрос, вида //example.com/page?param=value
   *
   * @type {String}
   */
  this.url        = '//' + this.host + this.original_request.url;

  /**
   * Разобранные УРЛ
   *
   * @type {Object}
   * @see http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost
   */
  this.parsed_url = url.parse( this.url, true, true );

  this.type       = this.method;
  if ( !params.action ) this.action = this.parsed_url.pathname;
  if ( !params.params ) this.params = this.parsed_url.query;
};


/**
 * HTTP редирект
 *
 * @param uri
 */
HTTPRequest.prototype.redirect = function( uri ){
  this.client.redirect( uri );
};