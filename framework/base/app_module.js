module.exports = AppModule.inherits( autodafe.AutodafePart );

/**
 * Базовый класс для модулей приложения. Поддерживает удобное логироние.
 *
 * @constructor
 * @extends AutodafePart
 * @param {Object} params см. {@link AppModule._init}
 * @example Пример использования
 *
 * <pre><code class="javascript">
 * module.exports = MyClass.inherits( autodafe.AppModule );
 *
 * function MyClass( params ) {
 *   this._init( params );
 * }
 *
 *
 * MyClass.prototype._init = function( params ) {
 *   MyClass.parent._init.call( this, params );   // вызываем родительский метод
 *
 *   //...
 * }
 *
 * //...
 *
 * var instance = new MyClass({
 *   app : application,                           // обязательно передаем ссылку на приложение
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
 * @private
 * @param {Object} params параметры необходимые для инициализации
 * @param {Application} params.app ссылка на приложение в котором раобтает данный модуль
 * @throws {Error} если params.app не является {@link Application}
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
   * Содержится в лююом классе унаследованном от {@link AppModule}, подобных классов в фреймворке большинство.
   * В теле методов контроллеров ({@link Controller}), моделей ({@link Model}), компонентов ({@link Component}) и т.д.
   * можно смело использовать this.app для обращения к текущему приложению.
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
 * или ошибкой. В случае, когда тип параметра Error, второй параметр автоматически выставится в 'error', но его можно
 * переопределить на любой другой. Если в логгер попадает объект класса Error, то логгер показывает trace пользуясь
 * именно ошибкой ( Error.trace ) , что точнее определяет место ее возникновения
 * @param {String} [level] Тип сообщения, может быть "info", "trace", "warning" или "error". По умолчанию - "trace".
 * Если первый параметр ошибка, по умолчанию - "error"
 * @example Пример использования
 *
 * <pre><code class="javascript">
 * // где-то в методе класса унаследованного от AppModule..
 *
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
 * @param [e] Чаще всего это ошибка, о которой нужно сообщить
 * @throws e - если он передан
 * @example Пример использования
 *
 * Рассмотрим метод, который делает какие-либо асинхронные действия и возвращает результат в callback, который в свою
 * очередь необязателен
 *
 * <pre><code class="javascript">
 * MyClass.prototype.do_something_async = function( callback ) {
 *   // проверяем полученный параметр и заменяем его на стандартный если callback не передан или передана не функция
 *   callback = typeof callback == 'function' ? callback : this.default_callback;
 *
 *   // ...что-нибудь делаем
 *
 *   if ( error_exist ) return callback( error );
 *
 *   return callback( null, result );
 * }
 * </code></pre>
 *
 * Теперь даже если метод не получит callback, ошибка не замолчится а пойдет дальше по указанным правилам.
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