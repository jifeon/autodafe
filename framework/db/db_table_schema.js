var AppModule = global.autodafe.AppModule;
var DbSchema  = require('./db_schema');

module.exports = DbTableSchema.inherits( AppModule );

/**
 * Базовый абстрактный класс для таблицы в базе данных
 *
 * Конструктор кидает TypeError
 *
 * @constructor
 * @extends AppModule
 */
function DbTableSchema() {
  throw new TypeError( 'You can\'t instantiate abstract class DbTableSchema' );
}

/**
 * Инициализация класса
 *
 * @param {Object} params хэш параметров
 * @param {DbSchema} params.db_schema Схема базы в которой находится таблица
 */
DbTableSchema.prototype._init = function( params ) {
  DbTableSchema.parent._init.call( this, params );

  /**
   * Схема базы в которой находится таблица
   *
   * @public
   * @name db_schema
   * @type {DbSchema}
   */
  this._.db_schema = params.db_schema;
  if ( !( this.db_schema instanceof DbSchema ) )
    throw new TypeError( '`sb_schema` in DbTableSchema._init should be instanceof DbSchema' );

  /**
   * Название таблицы
   *
   * @public
   * @name name
   * @type {String}
   */
  this.name           = null;

  /**
   * Экранированное и заключенное в правильные кавычки название таблицы ( возможно вместе с названием базы ).
   *
   * raw_name можно использовать в sql запросе
   *
   * @public
   * @name raw_name
   * @type {String}
   */
  this.raw_name       = null;

  /**
   * Название первичного ключа таблицы или массив названий, если их несколько
   *
   * @public
   * @name primary_key
   * @type {String|Array}
   */
  this.primary_key    = null;

  /**
   * Признак наличия в таблице колонки с автоинкрементом
   *
   * @public
   * @name in_sequence
   * @type {Boolean}
   */
  this.in_sequence    = false;

  /**
   * Признак инициализации таблицы. см. {@link MysqlTableSchema._init}
   *
   * @public
   * @name is_inited
   * @type {Boolean}
   */
  this.is_inited      = false;

  /**
   * Внешние ключи таблицы
   *
   * @public
   * @name foreign_keys
   * @type {Object}
   */
  this.foreign_keys   = {};

  /**
   * Хэш со столбцами.
   *
   * Ключи - названия столбцов, значения - экземпляры {@link DbColumnSchema}
   *
   * @protected
   * @name _columns
   * @type {Object}
   */
  this._._columns     = {};
};

/**
 * Возвращает схему столбца по заданному имени
 *
 * @param name Имя столбца
 * @returns {DbColumnSchema}
 */
DbTableSchema.prototype.get_column = function( name ) {
  return this._columns[ name ] || null;
};

/**
 * Проверяет наличие столбца в таблице
 *
 * @param name Имя столбца
 * @returns {Boolean}
 */
DbTableSchema.prototype.has_column = function( name ){
  return !!this._columns[ name ];
};

/**
 * Возвращает массив имен всех столбцов в таблице
 *
 * @returns {Array}
 */
DbTableSchema.prototype.get_column_names = function() {
  return Object.keys( this._columns );
};

/**
 * Для каждого первичного ключа выполняет функцию callback( String ) в контексте context
 *
 * @param {Function} callback
 * @param {Object} context
 */
DbTableSchema.prototype.each_primary_key = function ( callback, context ) {
  if ( this.primary_key == null ) return this.log(
    'DbTableSchema.each_primary_key try to use primary_key in table `%s`, but it is null'.format( this.name ),
    'warning'
  );

  var pks = Array.isArray( this.primary_key ) ? this.primary_key : [ this.primary_key ];
  pks.forEach( callback, context );
};

/**
 * Возвращает количество первичных ключей
 *
 * @returns {Number} Число первичных ключей
 */
DbTableSchema.prototype.get_number_of_pks = function () {
  return Array.isArray( this.primary_key )
    ? this.primary_key.length
    : this.primary_key
      ? 1
      : 0;
};