var tools = require( './lib/tools' );

var AutodafePart = require('./base/autodafe_part');
Autodafe.inherits( AutodafePart );

/**
 * Класс управляющий приложениями.
 *
 * Позволяет создавать приложения на основе конфигурации для них. По завершению процесса останавливает все приложения
 * ({@link Application.stop}).
 *
 * @constructor
 * @extends AutodafePart
 * @property {Function} AutodafePart конструктор {@link AutodafePart}
 * @property {Function} AppModule конструктор {@link AppModule}
 * @property {Function} Component конструктор {@link Component}
 * @property {Function} Widget конструктор {@link Widget}
 * @property {Function} Controller конструктор {@link Controller}
 * @property {Function} Model конструктор {@link Model}
 * @property {Object}   lib Ссылки на инструменты из библиотеки Autodafe
 * @property {Object}   lib.tools см. {@link Application.tools}
 * @property {Function} lib.Listener конструктор {@link ListenerForResponse}
 * @property {Object}   cc (ClientConnection) сборка ссылок на конструкторы классов обеспечивающих клиентские подключения
 * к приложению
 * @property {Function} cc.Request конструктор {@link Request}
 * @property {Function} cc.ClientConnection конструктор {@link ClientConnection}
 * @property {Function} cc.Client конструктор {@link Client}
 * @property {Function} cc.Response конструктор {@link Response}
 * @property {Function} cc.Listener конструктор {@link ListenerForResponse}
 * @property {Object}   cc.http Конструкторы классов, отвечающих за HTTP соединения
 * @property {Function} cc.http.Request конструктор {@link HTTPRequest}
 * @property {Function} cc.http.Server конструктор {@link HTTPServer}
 * @property {Function} cc.http.Client конструктор {@link HTTPClient}
 * @property {Object}   cc.ws Конструкторы классов, отвечающих за подключения по WebSockets
 * @property {Function} cc.ws.Request конструктор {@link WSRequest}
 * @property {Function} cc.ws.Server конструктор {@link WebSocketServer}
 * @property {Function} cc.ws.Client конструктор {@link WebSocketsClient}
 * @property {Object}   db сборка ссылок на конструкторы часто используемых модулей из компонента для работы с базой
 * данных
 * @property {Function} db.Expression конструктор {@link DbExpression}
 * @property {Function} db.Criteria конструктор {@link DbCriteria}
 * @property {Function} db.ActiveRecord конструктор {@link ActiveRecord}
 * @property {Object}   users сборка ссылок на конструкторы часто используемых модулей из компонента для работы с
 * пользователями
 * @property {Function} users.UserIdentity конструктор {@link UserIdentity}
 * @property {Function} users.RolesSet конструктор {@link RolesSet}
 * @property {Function} users.ModelsRolesSet конструктор {@link ModelsRolesSet}

 *
 * @example Класс содержит ссылки на часто используемые классы, что позволяет в некоторых ситуациях не использовать
 * require
 *
 * <pre><code class="javascript">
 * var db_expression = new global.autodafe.db.Expression('NOW()');
 * // вместо
 * var DbExpression = require('autodafe/framework/db/db_expression');
 * var db_expression = new DbExpression('NOW()');
 *
 * // Другой пример с наследованием контроллера
 * Site.inherits( global.autodafe.Controller );
 * function Site(){ ... }
 * </code></pre>
 */
function Autodafe() {
  this._init();
}


/**
 * Инициализация Autodafe - происходит один раз при первом подключении фреймворка
 *
 * @private
 */
Autodafe.prototype._init = function() {
  Autodafe.parent._init.call( this );

  global.autodafe       = this;

  /**
   * Директория, в которой расположен фреймворк
   *
   * @type {String}
   */
  this.base_dir         = __dirname;

  this.lib              = {};
  this.lib.tools        = tools;
  this.lib.Listener     = require('./lib/listener2.js');

  this.AutodafePart     = AutodafePart;
  this.AppModule        = require( './base/app_module.js' );
  this.Component        = require( './components/component.js' );
  this.Widget           = require( './components/widget.js' );
  this.Controller       = require( './base/controller.js' );
  this.Model            = require( './base/model.js' );
  this.FormModel        = require( './base/models/form_model.js' );

  this.cc                   = {};
  this.cc.Request           = require( './client_connections/request.js' );
  this.cc.ClientConnection  = require( './client_connections/client_connection.js' );
  this.cc.Client            = require( './client_connections/client.js' );
  this.cc.Response          = require( './client_connections/response.js' );
  this.cc.Listener          = require( './client_connections/listener_for_response.js' );
  this.cc.http              = {};
  this.cc.http.Request      = require( './client_connections/http/http_request.js' );
  this.cc.http.Server       = require( './client_connections/http/http_server.js' );
  this.cc.http.Client       = require( './client_connections/http/http_client.js' );
  this.cc.ws                = {};
  this.cc.ws.Request        = require( './client_connections/web_sockets/web_sockets_request.js' );
  this.cc.ws.Server         = require( './client_connections/web_sockets/web_sockets_server.js' );
  this.cc.ws.Client         = require( './client_connections/web_sockets/web_sockets_client.js' );

  this.db               = {};
  this.db.Expression    = require('./db/db_expression.js');
  this.db.Criteria      = require('./db/db_criteria.js');
  this.db.ActiveRecord  = require('./db/ar/active_record.js');

  this.users                = {};
  this.users.UserIdentity   = require('./users/user_identity.js');
  this.users.RolesSet       = require('./users/roles_set.js');
  this.users.ModelsRolesSet = require('./users/models_roles_set.js');

  /**
   * Созданные приложения
   *
   * Ключи - названия приложений, значения - сами приложения
   *
   * @type {Object}
   * @private
   */
  this._applications   = {};

  process.on( 'exit', this._on_exit.bind( this ) );
};


/**
 * Создает приложение
 *
 * @param {Object} config конфигурация приложения, обязательные параметры смотри в {@link Application._init}
 * @param {Function} [callback=AppModule.default_callback] Вызывается, если во время создания приложения
 * произошла ошибка ( callback( Error ) ), или после того как приложение полностью проинициализируется и будет готово
 * к запуску ( callback( null, {@link Application} ) )
 * @returns {Application} новое приложение
 * @example Создание и запуск минималистичного приложения
 *
 * <pre><code class="javascript">
 * var autodafe = require( 'autodafe' );
 * autodafe.create_application( { name : 'MyApp', base_dir : __dirname } ).run();
 * </code></pre>
 */
Autodafe.prototype.create_application = function ( config, callback ) {
  callback = typeof callback == 'function' ? callback : this.AppModule.prototype.default_callback;

  var Application = require('./base/application');
  try {
    var app = new Application( config );
  }
  catch( e ){
    callback( e );
    return null;
  }

  app.on( 'error', callback );
  app.on( 'ready', function(){ callback( null, app ) } );

  var name = app.name;
  if ( this._applications[ name ] ) {
    var warning = 'Creating few applications with same name `%s` can lead to bugs'.format( name );

    this._applications[ name ].log( warning, 'warning', 'Autodafe' );
    app.log( warning, 'warning', 'Autodafe' );
  }

  this._applications[ name ] = app;
  return app;
};


/**
 * Возвращает приложение по его имени.
 *
 * @param {String} name имя приложения
 * @returns {Application} Приложение если находит его и null если нет
 */
Autodafe.prototype.get_application = function ( name ) {
  return this._applications[ name ] || null;
};


/**
 * Выполняется при process.exit
 *
 * Проверяет были ли выведены сообщения в консоль хоть из одного приложения, если нет - показывает сообщение, что
 * нужно настроить логгер
 *
 * Выолняет для всех запущенных приложений {@link Application.close}
 *
 * @private
 */
Autodafe.prototype._on_exit = function () {
  var silent            = process.argv[2] == '--silent';
  var some_log_is_shown = false;

  for ( var name in this._applications ) {
    var log_router = this._applications[ name ].log_router;
    if ( log_router && log_router.get_route( 'console' ) ){
      some_log_is_shown = true;
      break;
    }
  }

  if ( !silent && !some_log_is_shown ) console.log(
    'If you not see any log messages, preload and configure a `log_router` component. ' +
    'To hide this message run the main script with `--silent` option' );

  for ( name in this._applications ) {
    var app = this._applications[ name ];
    if ( app.is_running ) app.stop();
  }
};

var autodafe = module.exports = new Autodafe;