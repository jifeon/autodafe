var path      = require('path');
var fs        = require('fs');

module.exports = ComponentsManager.inherits( autodafe.AppModule );


/**
 * ComponentsManager - класс управляющий загрузкой и подключением компонентов.
 *
 * Что такое компонент смотри в {@link Component}
 *
 * Менеджер компонентов различает компоненты 2х видов - системные ( те что идут вместе с Autodafe ) и пользовательские
 * ( написанные пользователем фреймворка для собственного приложения ). Автоматически в приложение загружаются
 * компоненты, чьи настройки указаны в конфигурационном файле. Если имена системного и пользовательского компонента
 * совпадают, приоритет отдается пользовательскому компоненту.
 *
 * Особый вид компонентов - виджеты, см. {@link Widget} Виджеты тоже бывают системные и пользовательсик.
 * Пользовательские ничем не отличаются от компонентов, кроме базового сласса Widget который унаследован от Component.
 * Системные виджеты набираются из директории framework/components/widgets при первой попытке создать виджет
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params см. {@link ComponentsManager._init}
 */
function ComponentsManager( params ) {
  this._init( params );
}


/**
 * Хэш где собраны ссылки на классы системных компонентов
 *
 * @static
 * @private
 * @type {Object}
 * @property {WebSocketsServer} web_sockets
 * @property {UsersManager} users
 * @property {DbController} db
 * @property {LogRouter} log_router
 * @property {TestComponent} tests
 * @property {Mailer} mail
 * @property {HTTPServer} http
 */
ComponentsManager._system_components = {
  'web_sockets'        : require( '../client_connections/web_sockets/web_sockets_server' ),
  'users'              : require( '../users/users_manager' ),
  'db'                 : require( '../db/db_controller' ),
  'log_router'         : require( '../logging/log_router' ),
  'tests'              : require( '../tests/test_component' ),
  'mail'               : require( '../mailing/mailer' ),
  'http'               : require( '../client_connections/http/http_server' )
};


/**
 * Инициализация ComponentsManager
 *
 * @private
 * @param {Object} params нет параметров для ComponentsManager, см {@link AppModule._init}
 */
ComponentsManager.prototype._init = function( params ) {
  ComponentsManager.parent._init.call( this, params );

  /**
   * Хэш хранящий информацию о загруженных компонентах
   *
   * Ключи хэша - имена компонентов, значения - {Boolean}, если true - компонент загружен. Хэш используется для
   * предотвращения повторной загрузки компонента.
   *
   * @private
   * @type {Object}
   */
  this._loaded          = {};

  /**
   * Хэш хранящий пользовательские компоненты
   *
   * Хэш заполняется при первой попытке загрузить компонент. Пользовательские компоненты рекурсивно набираются из
   * директории {@link Application.path_to_components}. Папки с названием lib при этом не парсятся. Ключи хеша -
   * названия компонентов одноименные с названием файлов, в которых они содержатся. Хначения - классы компонентов, см.
   * {@link Component}
   *
   * @private
   * @type {Object}
   */
  this._user_components = null;

  /**
   * Хэш хранящий системные виджеты
   *
   * Наполняется при первой попытке созадть виджет {@link ComponentsManager.create_widget}. Ключи - названия виджетов,
   * значения - классы виджетов, см. {@link Widget}
   *
   * @private
   * @type {Object}
   */
  this._system_widgets  = null;
};


/**
 * Загрузка компонента
 *
 * Метод ищет компонент в пользовательских, а затем в системных компонентах, загружает его и регистрирует в приложении
 * {@link Application.register_component}
 *
 * @param {String} name имя загружаемого компонента
 * @param {Object} [params={}] параметры для загружаемого компонента
 * @throws {Error} если не может найти файл с компонентом или найденный файл неправильного типа
 */
ComponentsManager.prototype.load = function ( name, params ) {
  if ( this._loaded[ name ] ) return false;

  this.log( 'Load component `%s`'.format( name ), 'trace' );

  var component_class = this.get_user_component( name ) || this.get_system_component( name );
  if ( !component_class || !autodafe.Component.is_instantiate( component_class.prototype ) )
    throw new Error( 'Try to load unknown component `%s`'.format( name ) );
  
  if ( !Object.isObject( params ) ) params = {};
  params.name = name;
  params.app  = this.app;

  var component = new component_class( params );
  this._loaded[ name ] = true;
  this.app.register_component( component );
};


/**
 * Возвращает системный компонент
 *
 * @param {String} name имя компонента
 * @returns {Function} конструктор компонента {@link Component}
 */
ComponentsManager.prototype.get_system_component = function ( name ) {
  return ComponentsManager._system_components[ name ];
};


/**
 * Возвращает пользовательский компонент
 *
 * Осуществляет поис в пользовательских компонентах и возвращает компонент с именем name. При первом обращении
 * пользовательские компоненты рекурсивно набираются из директории {@link Application.path_to_components}. Папки с
 * названием lib при этом не парсятся.
 *
 * @param {String} name имя искомого компонента
 * @returns {Function} конструктор компонента {@link Component}
 */
ComponentsManager.prototype.get_user_component = function ( name ) {
  if ( !this._user_components ) {
    var components_path = this.app.path_to_components;

    this._user_components = {};
    if ( path.existsSync( components_path ) ) {
      this.log( 'Collecting user components in ' + components_path );
      this._collect_components_in_path( components_path, this._user_components );
    }
  }

  if ( typeof this._user_components[ name ] == "string" )
    this._user_components[ name ] = require( this._user_components[ name ] );

  return this._user_components[ name ];
};


/**
 * Собирает пути до файлов внутри какой-либо директории.
 *
 * При этом пропуская директории с названием lib
 *
 * @private
 * @param {String} components_path путь до директории в которой надо собрать пути до файлов
 * @param {Object} components объект в который собираются пути до файлов. Ключи - названия файлов без расширения,
 * значения - имена файлов
 */
ComponentsManager.prototype._collect_components_in_path = function ( components_path, components ) {
  if ( path.basename( components_path ) == 'lib' ) return;

  var stats = fs.statSync( components_path );

  if ( stats.isDirectory() ) fs.readdirSync( components_path ).forEach( function( file ) {
      this._collect_components_in_path( path.join( components_path, file ), components );
    }, this );

  else if ( stats.isFile() ) {
    var component_name = path.basename( components_path, '.js' );

    if ( components[ component_name ] )
      this.log( 'Two or more user components with same name "%s" are found'.format( component_name ), 'warning' );
    else {
      components[ component_name ] = components_path;
      this.log( 'User component is found: %s'.format( component_name ) );
    }
  }
};


/**
 * Создает виджет
 *
 * При первом обращении коллекционирует все системные виджеты
 *
 * @param {String} name имя виджета
 * @param {Object} [params={}] параметры для виджета
 * @returns {Widget} виджет
 */
ComponentsManager.prototype.create_widget = function ( name, params ) {

  this.log( 'Creating widget `%s`'.format( name ), 'trace' );

  var widget_class = this.get_user_component( name ) || this.get_system_widget( name );
  if ( !widget_class || !autodafe.Widget.is_instantiate( widget_class.prototype ) )
    throw new Error( 'Try to load unknown widget: `%s`'.format( name ) );

  params      = params || {};
  params.name = name;
  params.app  = this.app;

  return new widget_class( params );
};


/**
 * Возвращает конструктор системного виджета
 *
 * Осуществляет поис в системных виджетах и возвращает виджет с именем name.
 *
 * @param {String} name имя виджета
 * @returns {Function} конструктор виджета {@link Widget}
 */
ComponentsManager.prototype.get_system_widget = function ( name ) {
  if ( !this._system_widgets ) {
    var widgets_path = path.join( __dirname, 'widgets' );

    this._system_widgets = {};
    if ( path.existsSync( widgets_path ) ) {
      this.log( 'Collecting system widgets' );
      this._collect_components_in_path( widgets_path, this._system_widgets );
    }
  }

  if ( typeof this._system_widgets[ name ] == "string" )
    this._system_widgets[ name ] = require( this._system_widgets[ name ] );

  return this._system_widgets[ name ];
};