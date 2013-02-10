var AppModule = global.autodafe.AppModule;
var _ = require('underscore');

module.exports = DbCommand.inherits( AppModule );

/**
 * Класс для работы с sql запросом
 *
 * @constructor
 * @extends AppModule
 * @param {Object} params см. {@link DbCommand._init}
 */
function DbCommand( params ) {
  this._init( params );
}

/**
 * Инициализация класса.
 *
 * @param {Object} params хэш параметров
 * @param {DbConnection} params.db_connection Соединение с базой данных
 * @param {String} [params.text=''] Текст sql запроса. Может содеражить участки для замены
 * см. {@link DbCommand._apply_params}, {@link DbCommand.bind_value}, {@link DbCommand.bind_values}
 */
DbCommand.prototype._init = function( params ) {
  DbCommand.parent._init.call( this, params );

  var DbConnection = require('./db_connection');
  if ( !params || !( params.db_connection instanceof DbConnection ) )
    throw new Error( '`db_connection` is not instance of DbConnection in DbCommand.init' );

  /**
   * Соединение с базой данных
   *
   * @public
   * @name db_connection
   * @type {DbConnection}
   */
  this._.db_connection = params.db_connection;

  /**
   * Текст sql запроса с после применения экранированных значений см. {@link DbCommand._apply_params}
   *
   * @protected
   * @name _text
   * @type {String}
   */
  this._text            = params.text || '';

  /**
   * Исходный текст sql запроса.
   *
   * Может содеражить участки для замены на экранированные значения. см. {@link DbCommand._apply_params},
   * {@link DbCommand.bind_value}, {@link DbCommand.bind_values}
   *
   * @protected
   * @name _source_text
   * @type {String}
   */
  this._source_text     = this._text;

  /**
   * Здесь содержаться именованные параметры, привязанные через {@link DbCommand.bind_value}, {@link DbCommand.bind_values}
   *
   * @protected
   * @name _params
   * @type {Object}
   */
  this._params          = {};

  /**
   * Признак того, применены ли текущие параметры к текущему тексту или нет
   *
   * @protected
   * @name _params_applied
   * @type {Boolean}
   */
  this._params_applied  = false;
};

/**
 * Скидывает значение _text и _params.
 *
 * @returns {DbCommand} Возвращает текущую команду.
 */
DbCommand.prototype.reset = function () {
  this._text            = '';
  this._source_text     = '';
  this._params          = {};
  this._params_applied  = false;

  return this;
};

/**
 * Возвращает текст sql запроса.
 *
 * @param {Boolean} as_is Если true, возвращает исходный текст запроса, иначе - с уже примененными параметрами.
 * @returns {String} текст sql запроса
 */
DbCommand.prototype.get_text = function ( as_is ) {
  if ( as_is ) return this._source_text;

  this._apply_params();
  return this._text;
};

/**
 * Задает текст sql запроса.
 *
 * Текст может содержать участки для замены на экранированные значения ( см. {@link DbCommand._apply_params} )
 *
 * @param {String} text Текст sql запроса
 * @returns {DbCommand} Возвращает текущую команду.
 */
DbCommand.prototype.set_text = function ( text ) {
  this._params_applied  = false;
  this._text            = text;
  this._source_text     = this._text;

  return this;
};

/**
 * Задает _params.
 *
 * При этом для копирования параметров используется функция Object.not_deep_clone().
 * Если params неподходящего типа - бросается ошибка Error.
 * Если значения параметров неподходящего типа, ошибка бросится во время _apply_params.
 * Если _apply_params вызвана из execute ошибка передастся в callback функции execute.
 *
 * @param {Object} params
 * @returns {DbCommand} Возвращает текущую команду
 */
DbCommand.prototype.bind_values = function ( params ) {
  if ( !_.isObject( params ) || Array.isArray( params ) ) {
    this.log( "`params` to `bind_values` should be instance of Object and not an Array", 'warning' );
    return this;
  }

  if ( _.isEmpty( params ) ) return this;
  this._params         = Object.not_deep_clone( params );
  this._params_applied = false;

  return this;
};

/**
 * Добавляет параметр к _params.
 *
 * Если значение value неподходящего типа, бросится ошибка во время _apply_params.
 * Если _apply_params вызвана из execute ошибка передастся в callback функции execute
 *
 * @param {String} name Имя параметра
 * @param {mixed} value Значение параметра
 * @returns {DbCommand} Возвращает текущую команду
 */
DbCommand.prototype.bind_value = function( name, value ) {
  this._params[ name ] = value;
  this._params_applied = false;
  return this;
};

/**
 * Выполняет привязку параметров ( см. {@link DbCommand._apply_params} ) к тексту запроса и делает запрос к базе.
 *
 * @param {Function} callback Описание см. в {@link DbConnection.query}, {@link MysqlConnection.query}
 * @returns {DbCommand} Возвращает текущую команду
 */
DbCommand.prototype.execute = function( callback ) {
  callback = typeof callback == "function" ? callback : function( e ) { throw e; }

  try {
    this._apply_params();
  }
  catch( e ) {
    callback( e );
  }

  this.db_connection.query( this._text, callback );
  return this;
};

/**
 * Выполняет sql запрос,а затем вызывает callback для значений первого столбца первой строки результата.
 *
 * Кидает в callback Error, если запрос возвращает пустой результат.
 *
 * @param {Function} callback
 */
DbCommand.prototype.query_scalar = function ( callback ) {
  this.execute( function( e, result ) {
    if ( e ) return callback( e );

    var success = false;
    result.fetch_array( function( row ) {
      callback( null, row[0] );

      success = true;
      return false;
    } );

    if ( !success ) callback( new Error( 'There are no expected result for DbCommand.query_scalar' ) );
  } );
};

/**
 * Выполняет привязку параметров.
 *
 * Ключи _params - подстроки, которые будут искаться в тексте text запроса и заменяться на экранированные значения _params.
 * Ключи параметров должны начинаться с : ( двоеточия ), если это не так они приводятся к такому виду принудительно.
 * Все вставляемые значения экранируются через {@link DbConnection.quote_value}
 */
DbCommand.prototype._apply_params = function () {
  if ( this._params_applied ) return;

  for ( var name in this._params ) {
    var true_name = name[0] == ':' ? name : ':' + name;
    this._text = this._text.replace( new RegExp( true_name + '(?=[^\\w\\d_]|$)', 'g' ), this.db_connection.quote_value( this._params[ name ] ) );
  }

  this._params_applied = true;
};