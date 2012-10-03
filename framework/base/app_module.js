module.exports = AppModule.inherits( global.autodafe.AutodafePart );

/**
 * Базовый класс для модулей приложения.
 *
 * Обеспечивает наличие ссылки на приложение во всех классах, унаследованных от него. А также поддерживает удобное
 * логирование.
 *
 * @constructor
 * @extends AutodafePart
 * @param {Object} params параметры для инициализации
 * @param {Application} params.app ссылка на приложение в котором раобтает данный модуль
 * @throws {Error} параметр params.app не является экземпляром {@link Application}
 * @example <pre><code class="javascript">
 * module.exports = MyClass.inherits( global.autodafe.AppModule );
 *
 * function MyClass( params ) {
 *   this._init( params );
 * }
 *
 *
 * MyClass.prototype._init = function( params ) {
 *   // вызываем родительский метод
 *   MyClass.parent._init.call( this, params );
 *
 *   //...
 * }
 *
 * // использование
 * var instance = new MyClass({
 *   // обязательно передаем ссылку на приложение
 *   app : application,
 *   ...
 * });
 * </code></pre>
 */
function AppModule( params ) {
  this._init( params );
}


/**
 * Инициализация AppModule
 *
 * @param {Object} params см. {@link AppModule}
 * @private
 */
AppModule.prototype._init = function( params ) {
  AppModule.parent._init.call( this, params );

  var Application = require( './application' );

  if ( !params || !Application.is_instantiate( params.app ) ) throw new Error(
    'Link to application is not defined or has wrong type' + ( this.class_name
      ? ' in `%s._init`'.format( this.class_name )
      : ' in `_init` method of class inherited from AppModule. Also class inherited from AppModule should be defined ' +
      'as `function Name() {}` instead of `var Name = function() {}` because AppModule uses `this.constructor.name` ' +
      'property for logging'
    )
  );

  /**
   * Ссылка на приложение
   *
   * Содержится в любом классе унаследованном от {@link AppModule}, подобных классов в фреймворке большинство.
   * В теле методов контроллеров ({@link Controller}), моделей ({@link Model}), компонентов ({@link Component}) и т.д.
   * можно смело использовать <code>this.app</code> для обращения к текущему приложению.
   *
   * @type {Application}
   */
  this._.app = params.app;

  if ( !this.class_name ) this.app.log(
    'Class inherited from AppModule should be defined as `function Name() {}` instead of `var Name = function() {}`' +
    ' because AppModule uses `this.constructor.name` property for logging',
    'warning', 'AppModule'
  );
};


/**
 * Логирует сообщение
 *
 * Метод иcпользует {@link Logger.log}
 *
 * @param {String|Error} message Сообщение, которое будет залогировано. Может быть строкой содержащей текст сообщения
 * или ошибкой. В случае, когда тип параметра <code>Error</code>, второй параметр автоматически выставится в
 * <code>'error'</code>, но его можно переопределить на любой другой. Если в логгер попадает объект класса Error, то
 * логгер показывает stack trace, пользуясь именно ошибкой (<code>Error.trace</code>). Это точнее определяет место ее
 * возникновения
 * @param {String} [level] Тип сообщения, может быть <code>info</code>, <code>trace</code>, <code>warning</code> или
 * <code>error</code>. По умолчанию равен <code>trace</code>, а если первый параметр ошибка, по умолчанию -
 * <code>error</code>
 * @example Где-то в методе класса унаследованного от {@link AppModule}
 * <pre><code class="javascript">
 * this.log( 'Text of message', 'info' );
 * this.log( new Error( 'Error while doing something' ) );
 * this.log( new Error( 'Something wrong' ), 'warning' );
 * </code></pre>
 */
AppModule.prototype.log = function ( message, level ) {
  this.app.logger.log( message, level, this.class_name );
};


/**
 * Стандартный callback
 *
 * Функция используется в местах где параметр callback необязателен, всместо него используется эта функция. Если первым
 * аргументом она получает не null и не undefined, она кидает ( throw ) этот параметр.
 *
 * @param {Error} [e=null] Ошибка, возникшая во время выполнения функции
 * @throws {Error} параметр <code>e</code> отличен от <code>null</code>
 * @example Рассмотрим метод, который делает какие-либо асинхронные действия и возвращает результат в callback, который
 * в свою очередь необязателен:
 * <pre><code class="javascript">
 * MyClass.prototype.do_something_async = function( callback ) {
 *   // проверяем полученный параметр и заменяем его на стандартный callback, если callback не передан или переданный
 *   // параметр не является функцией
 *   callback = typeof callback == 'function' ? callback : this.default_callback;
 *
 *   // ...что-нибудь делаем
 *
 *   if ( error_exist ) return callback( error );
 *
 *   return callback( null, result );
 * }
 * </code></pre>
 * Теперь даже если метод не получит callback, ошибка не замолчится, а пойдет дальше по указанным правилам.
 */
AppModule.prototype.default_callback = function ( e ) {
  if ( e != null ) throw e;
};


/**
 * Функция заглушка для будующего i18n
 *
 * @param {String} text текст который нужно получить на текущем языке
 * @return {String}
 */
AppModule.prototype.t = function ( text ) {
  return text;
};