var AppModule = global.autodafe.AppModule;

module.exports = DbColumnSchema.inherits( AppModule );

/**
 * Базовый абстрактный класс для столбца в базе данных.
 *
 * Конструктор кидает TypeError
 *
 * @constructor
 * @extends AppModule
 */
function DbColumnSchema() {
  throw new Error( 'You can\'t instantiate abstract class DbColumnSchema' );
}

/**
 * Инициализация класса
 *
 * @param {Object} params хэш параметров
 * @param {DbSchema} params.db_schema Схема базы в которой находится столбец
 * @param {Boolean} [params.allow_null=null] Могут ли значение в этом столбце быть равными null
 * @param {String} [params.db_type=null] Тип столбца в синтаксисе базы данных
 * @param {String} [params.type='string'] Тип столбца. Может быть "string", "integer", "double", "boolean"
 * @param {mixed} [params.default_value=null] значение по умолчанию для столбца
 * @param {Boolean} [params.is_primary_key=false] Содержит ли столбец первичный ключ
 * @param {String} [params.name=''] Имя столбца ( без кавычек )
 */
DbColumnSchema.prototype._init = function( params ) {
  DbColumnSchema.parent._init.call( this, params );

  if ( !params || !params.db_schema ) throw new Error( 'Link to Db schema is undefined in DbColumnSchema.init' );

  /**
   * Схема базы в которой находится столбец
   *
   * @public
   * @name db_schema
   * @type {DbSchema}
   */
  this._.db_schema      = params.db_schema;

  /**
   * Могут ли значение в этом столбце быть равными null
   *
   * @public
   * @name allow_null
   * @type {Boolean}
   */
  this._.allow_null     = params.allow_null     || null;

  /**
   * Тип столбца в синтаксисе базы данных
   *
   * @public
   * @name db_type
   * @type {String}
   */
  this._.db_type        = params.db_type        || null;

  /**
   * Тип столбца. Может быть "string", "integer", "double", "boolean"
   *
   * @public
   * @name type
   * @type {String}
   */
  this._.type           = this._extract_type();

  /**
   * Значение по умолчанию для столбца
   *
   * @public
   * @name default_value
   * @type {mixed}
   */
  this._.default_value  = this._extract_default( params.default_value );


  /**
   * Размер столбца
   *
   * @public
   * @name size
   * @type {Number}
   */
  this.size             = null;

  /**
   * Точность значений в столбце, если они числовые
   *
   * @public
   * @name precision
   * @type {Number}
   */
  this.precision        = null;

  /**
   * Масштаб значений в столбце, если они числовые
   *
   * @public
   * @name scale
   * @type {Number}
   */
  this.scale            = null;
  this._extract_limit();


  /**
   * Содержит ли столбец первичный ключ
   *
   * @public
   * @name is_primary_key
   * @type {Boolean}
   */
  this._.is_primary_key = params.is_primary_key || false;

  /**
   * Имя столбца ( без кавычек )
   *
   * @public
   * @name name
   * @type {String}
   */
  this._.name           = params.name           || '';

  /**
   * 	Имя столбца, экранированное и в кавычках.
   *
   * Возможно вместе с именем таблицы и базы данных. Готово к употреблению в sql запросе
   *
   * @public
   * @name raw_name
   * @type {String}
   */
  this._.raw_name       = this.name ? this.db_schema.quote_column_name( this.name ) : null;
};

/**
 * В зависимости от db_type находит type
 *
 * @protected
 * @returns {String}
 */
DbColumnSchema.prototype._extract_type = function() {
  if ( !this.db_type ) return "string";

  if ( this.db_type.toLowerCase().indexOf( 'int' ) != -1 )      return 'integer';
  if ( this.db_type.toLowerCase().indexOf( 'bool' ) !== false ) return 'boolean';
  if ( this.db_type.search( /(real|floa|doub)/i ) != -1 )       return 'double';

  return 'string';
}


/**
 * В зависимости от db_type находит size, precision и scale
 *
 * @protected
 */
DbColumnSchema.prototype._extract_limit = function() {
  var matches;

  if (
    ( this.db_type.indexOf( '(' ) != -1 ) &&
    ( matches = this.db_type.match( /\((.*)\)/ ) )
  ) {
    var values  = matches[1].split( ',' );
    this._.size = this._.precision = Number( values[0] );
    if ( values[1] ) this._.scale  = Number( values[1] );
  }
}


/**
 * Приводит default_value к типу столбца. Результат записывается в default_value
 *
 * @protected
 * @returns {mixed}
 */
DbColumnSchema.prototype._extract_default = function( default_value ) {
  return default_value ? this.typecast( default_value ) : null;
}

/**
 * Приводит значение value к значению столбца и возвращает его
 *
 * @public
 * @param {mixed} value
 * @returns {mixed}
 */
DbColumnSchema.prototype.typecast = function( value ) {
  if ( this.__get_type( value ) == this.type || value == null || value instanceof Error || value instanceof Date )
    return value;

  switch ( this.type ) {
    case 'string':  return String( value );
    case 'integer':
      value = Number( value );
      return isNaN( value ) ? null : value;
    case 'boolean': return !!value;
    case 'double':
    default: return value;
  }
};

/**
 * Возвращает тип value: "string", "integer", "double" или "boolean"
 *
 * @param {mixed} value
 * @returns {"string"|"integer"|"double"|"boolean"}
 */
DbColumnSchema.prototype.__get_type = function ( value ) {
  var t = typeof value;
  if ( t == 'string' || t == 'boolean' ) return t;
  if ( t == 'number' ) return Math.round( t ) == t ? 'integer' : 'double';
  return t;
};