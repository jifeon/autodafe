var path = require('path');
var auth = require('http-auth');

module.exports = HTTPServer.inherits( global.autodafe.cc.ClientConnection );


/**
 * Компонент позволяющий общаться с приложением по протоколу HTTP
 *
 * После запуска приложения запускает HTTP сервер, и на каждый запрос создает {@link HTTPClient}, который вполследствии
 * выполняет данный запрос. Помимо этого компонент умеет проводить HTTP аутентификацию.
 *
 * @constructor
 * @extends ClientConnection
 * @param {Object} params см. {@link HTTPServer._init}
 */
function HTTPServer( params ) {
  this._init( params );
}


/**
 * Инициализация HTTPServer
 *
 * @private
 * @param {Object} params параметры для инициализации HTTPServer
 * @param {Number} [params.port=80] Порт на котором будет запущен HTTP сервер
 * @param {String} [params.upload_dir='/tmp'] Директория в которую будут складываться загруженные файлы. Может быть
 * абсолютным или относительным начиная с {@link Application.base_dir}
 * @param {Object} [params.root_folders={}] Корневые директории, в которых хранятся статические файлы. Например, если
 * root_folder выглядит так:
 * <pre><code class="javascript">
 * root_folders : {
 *   css : 'views/css'
 * }
 * </code></pre>
 * то приложение по запросу /css/style.css проверит наличие файла views/css/style.css, и отдаст его, если он существует
 * @param {Object} [params.basic_auth] Настройки http аутентификации
 * @see ClientConnection._init
 */
HTTPServer.prototype._init = function( params ) {
  HTTPServer.parent._init.call( this, params );

  /**
   * Порт на котором запущен HTTP сервер
   *
   * @type {Number}
   * @default 80
   */
  this._.port         = params.port || 80;

  /**
   * Абсолютный путь до директории, в которую будут загружаться файлы
   *
   * @type {String}
   * @default /tmp
   */
  this._.upload_dir   = path.resolve( this.app.base_dir, params.upload_dir || '/tmp' );

  /**
   * Корневые директории, в которых хранятся статические файлы. Ключи - первая часть пути URL. Значения -
   * соответствующие им директории
   *
   * @private
   * @type {Object}
   */
  this._root_folders  = params.root_folders || {};

  /**
   * Node http сервер
   *
   * @private
   * @type {http.Server}
   * @see <a href="http://nodejs.org/docs/latest/api/http.html#http.Server">http.Server in node docs</a>
   */
  this._server        = null;

  /**
   * Настройки для HHTP аутентификации
   *
   * @private
   * @type {Object}
   */
  this._basic_auth    = params.basic_auth;
};


/**
 * Запуск сервера
 *
 * Выполняется после запуска приложения {@link Application.run}. Создает сервер и начинает принимать HTTP запросы
 *
 * @private
 */
HTTPServer.prototype._run = function () {
  this._server = this.get_server( this.port );
  if ( !this._server ) return this.log( 'HTTP server is not running at port ' + this.port, 'warning' );

  var basic_auth;
  if ( this._basic_auth ) {
    var auth_users = [];
    for ( var user in this._basic_auth.users ) {
      auth_users.push( user + ':' + this._basic_auth.users[ user ] );
    }

    basic_auth = auth({
      authRealm : this._basic_auth.message || 'Autodafe private area with basic access authentication.',
      authList  : auth_users
    });
  }

  var self = this;
  this._server.on( 'request', function( request, response ) {
    if ( basic_auth ) basic_auth.apply( request, response, self.create_client.bind( self, request, response ) );
    else self.create_client( request, response );
  } );

  this._server.on( 'close', function( errno ) {
    self.emit( 'close', errno );
  } );

  this.log( 'HTTP server started at port ' + this.port, 'info' );
};


/**
 * Создает http клиента
 *
 * @param {http.ServerRequest} request
 * @param {http.ServerResponse} response
 * @see <a href="http://nodejs.org/docs/latest/api/http.html#http.ServerRequest">http.ServerRequest in node docs</a>
 * @see <a href="http://nodejs.org/docs/latest/api/http.html#http.ServerResponse">http.ServerResponse in node docs</a>
 * @returns {HTTPClient}
 */
HTTPServer.prototype.create_client = function ( request, response ) {
  return new global.autodafe.cc.http.Client({
    app         : this.app,
    connection  : this,
    request     : request,
    response    : response
  });
};


/**
 * Останавливает HTTP сервер.
 *
 * По умолчанию вызывается при остановке приложения.
 */
HTTPServer.prototype.close = function() {
  try{
    if ( this._server ) {
      this._server.close();
      this.log( 'HTTP server port closed', 'info' );
    }
    else this.log( 'No HTTP server to stop', 'warning' );
  } catch( e ) {
    this.log( e, 'warning' );
  }
};


/**
 * Возвращает путь до корневой директории со статическими файлами
 *
 * @param {String} name название корневой директории
 * @returns {String}
 * @see HTTPServer._root_folders
 */
HTTPServer.prototype.get_root_folder = function( name ) {
  return this._root_folders[ name ] || null;
};


/**
 * Задает путь до корневой директории со статическими файлами
 *
 * @param {String} name название сокращения
 * @param {String} path путь до директории
 * @see HTTPServer._root_folders
 */
HTTPServer.prototype.set_root_folder = function( name, path ){
  this._root_folders[ name ] = path;
};


/**
 * Удаляет путь до корневой директории со статическими файлами
 *
 * @param {String} name название удаляемой корневой директории
 * @see HTTPServer._root_folders
 */
HTTPServer.prototype.remove_root_folder = function( name ){
  delete this._root_folders[ name ];
};
