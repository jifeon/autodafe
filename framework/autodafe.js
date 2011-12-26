var tools = require( './lib/tools' );

var AutodafePart = require('./base/autodafe_part');
Autodafe.inherits( AutodafePart );

/**
 * Класс управляющий приложениями.
 *
 * Позволяет создавать приложения на основе конфигурации для них. По завершениею процесса закрывает все приложения.
 * ( {@link Application.close} )
 *
 * @constructor
 * @extends AutodafePart
 * @property {Function} AutodafePart конструктор {@link AutodafePart}
 * @property {Function} AppModule конструктор {@link AppModule}
 * @property {Function} Component конструктор {@link Component}
 * @property {Function} Widget конструктор {@link Widget}
 * @property {Function} Controller конструктор {@link Controller}
 * @property {Function} Model конструктор {@link Model}
 * @property {Object} db сборка ссылок на конструкторы часто используемых модулей из компонента для работы с базой
 * данных
 * @property {Function} db.Expression конструктор {@link DbExpression}
 * @property {Function} db.Criteria конструктор {@link DbCriteria}
 * @property {Function} db.ActiveRecord конструктор {@link ActiveRecord}
 * @example Создание и запуск минималистичного приложения приложения
 *
 * ```javascript
 * var autodafe = require( 'autodafe' );
 * autodafe.create_application( { name : 'MyApp', base_dir : __dirname } ).run();
 * ```
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

  this.AutodafePart     = AutodafePart;
  this.AppModule        = require( './base/app_module.js' );
  this.Component        = require( './components/component.js' );
  this.Widget           = require( './components/widget.js' );
  this.Controller       = require( './base/controller.js' );
  this.Model            = require( './base/model.js' );
  this.db               = {};
  this.db.Expression    = require('./db/db_expression.js');
  this.db.Criteria      = require('./db/db_criteria.js');
  this.db.ActiveRecord  = require('./db/ar/active_record.js');

  /**
   * Созданные приложения
   *
   * @type {Application[]}
   */
  this._.applications   = [];

  process.on( 'exit', this.on_exit.bind( this ) );
};


/**
 * Создает приложение
 *
 * @param {Object} config конфигурация приложения
 * @returns {Application} новое приложение
 */
Autodafe.prototype.create_application = function ( config ) {
  var Application = require('./base/application.js');
  var app = new Application( config );
  this.applications.push( app );
  return app;
};


/**
 * Выполняется при process.exit
 *
 * Проверяет были ли выведены сообщения в консоль хоть из одного приложения, если нет - показывает сообщение, что
 * нужно настроить логгер
 *
 * Выолняет для всех приложений {@link Application.close}
 */
Autodafe.prototype.on_exit = function () {
  var silent            = process.argv[2] == '--silent';
  var some_log_is_shown = this.applications.some( function( app ){
    return app.log_router.get_route( 'console' );
  } );

  if ( !silent && !some_log_is_shown ) console.log(
    'If you don\'t look any log messages, preload and configure `log_router` component. ' +
    'To hide this message run the application with `--silent` option' );

  this.applications.forEach( function( app ) {
    app.close();
  } );
};

module.exports = new Autodafe;