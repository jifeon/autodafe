var AppModule   = global.autodafe.AppModule;
var DbCommand   = require( './db_command' );

module.exports = DbConnection.inherits( AppModule );

/**
 * Базовый абстрактный класс для соединения с базой данных.
 *
 * Конструктор класса кидает TypeError.
 *
 * @constructor
 * @extends AppModule
 */
function DbConnection() {
  throw new TypeError( 'DbConnection is abstract class. You can\'t instantiate it!' );
}

/**
 * Инициализация соединения с базой данных.
 *
 * @private
 * @param {Object} params Параметры соединения
 * @param {String} [params.user='root']
 * @param {String} [params.password='']
 * @param {String} [params.database='test']
 * @param {String} [params.host='localhost']
 * @param {String} [params.encoding='utf-8']
 */
DbConnection.prototype._init = function( params ) {
  DbConnection.parent._init.call( this, params );

  /**
   * Имя пользователя для базы данных. По умолчанию root
   *
   * @public
   * @name user
   * @type {String}
   */
  this._.user     = params.user     || 'root';

  /**
   * Пароль пользователя для базы данных. По умолчанию пароль отсутствует.
   *
   * @public
   * @name pass
   * @type {String}
   */
  this._.password = params.password || '';

  /**
   *  Имя базы данных.По умолчанию test
   *
   * @public
   * @name database
   * @type {String}
   *
   */
  this._.database = params.database || 'test';

  /**
   * Хост, на котором распологается сервер базы данных.По умолчанию localhost
   *
   * @public
   * @name host
   * @type {String}
   *
   */
  this._.host     = params.host     || 'localhost';

  /**
   * Кодировка базы данных. Устанавливается запросом SET NAMES ... По умолчанию utf-8
   *
   * @public
   * @name encoding
   * @type {String}
   */
  this._.encoding = params.encoding || 'utf8';

  /**
   * Схема базы данных, к которой выполнено подключение
   *
   * @public
   * @name db_schema
   * @type {DbSchema}
   *
   */

  this.db_schema  = null;
};

/**
 * Создает и возвращает экземпляр класса {@link DbCommand}
 *
 * @param {String} sql Строка запроса к базе данных
 * @returns {DbCommand} экземпляр класса для работы с sql запросом
 */
DbConnection.prototype.create_command = function( sql ) {
  return new DbCommand({
    db_connection : this,
    text          : sql,
    app           : this.app
  });
};

/**
 * Кидает ошибку Error, метод должен быть перегружен в наследуемых классах. ( см. {@link MysqlConnection.query} )
 *
 * @param {String} sql
 * @param {Function} callback
 */
DbConnection.prototype.query = function ( sql, callback ) {
  throw new Error( 'You should implement method `query` in inherited classes' );
};

/**
 * Приводит параметр к строке, готовой к вставке в sql запрос.
 *
 * Параметр можеть быть String, Number, null, Date, Boolean, Object с правильно реализованным методом toString
 * ( в этом случае будет логировано предупреждение ). В остальных случаях будет кинута ошибка Error
 *
 * @param {String|Number|null|Date|Boolean|Object} x
 */
DbConnection.prototype.quote_value = function ( x ) {
  switch ( typeof x ) {
    case 'string':
      return "'" + this.escape_sql_str( x ) + "'";

    case 'number':
      return x.toString();

    case 'object':
      if ( x == null )
        return 'NULL';

      else if ( x instanceof Date )
        return "'" + x.toISOString() + "'";

      else {
        this.log( 'Unknown type of `object`. Trying `toString` method', 'warning' );
        return this.quote_value( x.toString() );
      }

    case 'boolean':
      return Number( !!x ).toString();

    case 'undefined':
      return "''";

    default:
      throw new Error( 'DbConnection.quote_value: unknown type: ' + typeof x );
  }
};

/**
 * Экранирует строку для sql
 *
 * @param {String} str
 */
DbConnection.prototype.escape_sql_str = function( str ) {
  return str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0":    return "\\0";
      case "\n":    return "\\n";
      case "\r":    return "\\r";
      case "\b":    return "\\b";
      case "\t":    return "\\t";
      case "\x1a":  return "\\Z";
      default:      return "\\"+s;
    }
  });
}