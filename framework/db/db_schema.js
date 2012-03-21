var CommandBuilder = require( './command_builder' );
var AppModule      = global.autodafe.AppModule;
var DbConnection   = require( './db_connection' );

module.exports = DbSchema.inherits( AppModule );

/**
 * Базовый абстрактный класс отражающий структуру базы данных.
 *
 * Конструктор кидает TypeError
 *
 * @constructor
 * @extends AppModule
 */

function DbSchema() {
  throw new TypeError( 'You can\'t instantiate abstract class DbSchema' );
}

/**
 * Инициализация класса.
 *
 * @param {Object} params Содержит ссылку на соединение с базой данных
 */

DbSchema.prototype._init = function( params ) {
  DbSchema.parent._init.call( this, params );

  /**
   * Ссылка на соединение с базой
   *
   * @public
   * @name db_connection
   * @type {DbConnection}
   */
  this._.db_connection = params.db_connection;
  if ( !( this.db_connection instanceof DbConnection ) )
    throw new Error( '`db_connection` in DbSchema._init should be instance of DbConnection' );

  /**
   * Строитель запросов к базы данных
   *
   * @public
   * @name command_builder
   * @type {CommandBuilder}
   */

  var command_builder = null;
  Object.defineProperty( this, 'command_builder', {
    get : function() {
      return command_builder || ( command_builder = new CommandBuilder({
        db_schema : this,
        app       : this.app
      }) );
    },
    // uses in `refresh` to delete cached link to command builder.
    set : function( v ) {
      if ( !v ) command_builder = null;
    }
  });

  /**
   * Хэш, который хранит уже инициализированные таблицы.
   *
   * Ключи - название таблиц, значения - объекты {@link DbTableSchema}
   *
   * @protected
   * @name _tables
   * @type {Object}
   */
  this._tables      = {};

  /**
   * Хэш, который хранит имена таблиц для конкретной базы.
   *
   * Ключи - название баз, значения - массивы названий таблиц

   * @protected
   * @name _tables_names
   * @type {Object}
   */
  this._table_names = {};
};

/**
 * Ищет инициализированную таблицу с именем name, если не находит, пытается ее создать, после чего
 * асинхронно вызывает callback.
 *
 * @param {String} name Имя таблицы в базе данных
 * @param {Function} callback Принимает два параметра: ошибку в случае неудачи, и схему таблицы
 * @param {Object} context контекст в котором будет вызван callback
 */

DbSchema.prototype.get_table = function( name, callback, context ) {
  var table = this._tables[ name ];

  if ( !table ) return this._load_table( name, callback, context );

  table.setMaxListeners( 100 );

  if ( table.is_inited ) callback.call( context || null, null, table );
  else table
    .on( 'ready', function() {
      callback.call( context || null, null, table );
    } )
    .on( 'error', function( e ) {
      callback.call( context || null, e );
    } );
};

/**
 * Ищет все таблицы для конкретной базы schema.
 *
 * Если schema равна null, то для текущей, к которой выполнено подключение, после чего вызывает callback.
 *
 * @param {String} schema Имя базы данных.
 * @param {Function} callback Принимает ошибку при неудаче и объект, ключи которого - названия таблиц,
 * а значения - экземпляры {@link DbTableSchema}
 */

DbSchema.prototype.get_tables = function ( schema, callback ) {
  this.get_table_names( schema, function( e, names ) {
    if ( e ) return callback( e );

    var tables = {};

    names.for_each( this.get_table, this, function( e, table ) {
      if ( e ) return callback( e );

      tables[ table.name ] = table;

      if ( Object.keys( tables ).length == names.length ) callback( null, tables );
    } );
  });
};

/**
 * Берет из кеша или ищет названия всех таблицы для конкретной базы schema.
 *
 * Если schema равно null, то для текущей, к которой выполнено подключение, после чего вызывает callback.
 *
 * @param {String} schema
 * @param {Function} callback Принимает ошибку при неудаче и массив из названий таблиц
 */
DbSchema.prototype.get_table_names = function ( schema, callback ) {
  schema = schema || '';

  if ( this._table_names[ schema ] ) return callback( null, this._table_names[ schema ] );

  this._find_table_names( schema, callback );
};

/**
 * Сбрасывает закешированные таблицы, также при следующем обращении к command_builder'у, он будет пересоздан
 */
DbSchema.prototype.refresh = function () {
  this._tables      = {};
  this._table_names = {};

  this.command_builder = null;
};

/**
 * Подгатавливает название таблицы name для использования в sql запросе.
 *
 * Если перед ним есть название базы то оно тоже будет обработано.
 *
 * @param {String} name Название таблицы.
 * @returns {String}
 */
DbSchema.prototype.quote_table_name = function ( name ) {
  if ( name.indexOf('.') == -1 ) return this.quote_simple_table_name( name );

  return name.split('.').map( this.quote_simple_table_name ).join('.');
};

/**
 * Экранирует и заключает в кавычки простое название таблицы name, используется в {@link DbSchema.quote_table_name}
 *
 * @param {String} name Название таблицы.
 * @returns {String}
 */
DbSchema.prototype.quote_simple_table_name = function ( name ) {
  return "'" + this.connection.escape_sql_str( name ) + "'";
};

/**
 * Подгатавливает название столбца таблицы name для использования в sql запросе.
 *
 * Если перед ним есть название таблицы и базы, то они тоже будут обработаны корректно.
 *
 * @returns {String}
 * @param {String} name Название столбца таблицы.
 */
DbSchema.prototype.quote_column_name = function ( name ) {
  var prefix  = '';
  var dot_pos = name.lastIndexOf( '.' );

  if ( dot_pos != -1 ) {
    prefix = this.quote_table_name( name.substr( 0, dot_pos ) );
    name   = name.substr( dot_pos + 1 );
  }

  return prefix + ( name == '*' ? name : this.quote_simple_column_name( name ) );
};

/**
 * Сейчас метод просто экранирует тип колонки. В будующем сможет выбирать тип из заданного множества по сокращению.
 *
 * @param {String }type
 * @returns {String}
*/
DbSchema.prototype.get_column_type = function ( type ) {
  return this.connection.escape_sql_str( type );
};

/**
 * Экранирует и заключает в кавычки простое название столбца name, используется в {@link quote_column_name}
 *
 * @param {String} name Название столбца таблицы.
 * @returns {String}
 */
DbSchema.prototype.quote_simple_column_name = function ( name ) {
  return '"' + this.connection.escape_sql_str( name ) + '"';
};

/**
 * Возвращает sql запрос для создания таблицы.
 *
 * @param {String} table Название таблицы.
 * @param {Object} columns Столбцы таблицы. Ключи - названия, значения - типы столбцов.
 * @param {String} [options=''] Добавляется в конец запроса.
 * @returns {String}
 */
DbSchema.prototype.create_table = function ( table, columns, options ) {
  options = options || null;

  var cols = [];

  for ( var name in columns )
    cols.push( '\t' + this.quote_column_name( name ) + ' ' + this.get_column_type( columns[ name ] ) );

  var sql = "CREATE TABLE %s (%s)".format( this.quote_table_name( table ), '\n' + cols.join('\n') + '\n' );
  return options == null ? sql : sql + ' ' + options;
};

/**
 * Возвращает sql запрос для переименования таблицы
 *
 * @param {String} table Название таблицы
 * @param {String} new_name Новое название таблицы
 * @returns {String}
 */
DbSchema.prototype.rename_table = function ( table, new_name ) {
  return "RENAME TABLE %s TO %s".format( this.quote_table_name( table ), this.quote_table_name( new_name ) );
};

/**
 * Возвращает sql запрос для удаления таблицы
 *
 * @param {String} table Название таблицы
 * @returns {String}
 */
DbSchema.prototype.drop_table = function ( table ) {
  return "DROP TABLE " + this.quote_table_name( table );
};

/**
 * Возвращает sql запрос для полной очистки таблицы
 *
 * @param {String} table Название таблицы
 * @returns {String}
 */
DbSchema.prototype.truncate_table = function ( table ) {
  return "TRUNCATE TABLE " + this.quote_table_name( table );
};

/**
 * Возвращает sql запрос для добавления столбца в таблицу
 *
 * @param {String} table Название таблицы
 * @param {String} column Название столбца
 * @param {String} type Тип столбца
 * @returns {String}
 */
DbSchema.prototype.add_column = function ( table, column, type ) {
  return "ALTER TABLE %s ADD %s %s".format(
    this.quote_table_name( table ),
    this.quote_column_name( column ),
    this.get_column_type( type )
  );
};

/**
 * Возвращает sql запрос для удаления столбца из таблицы
 *
 * @param {String} table Название таблицы
 * @param {String} column Название столбца
 * @returns {String}
 */
DbSchema.prototype.drop_column = function ( table, column ) {
  return "ALTER TABLE %s DROP COLUMN %s".format(
    this.quote_table_name( table ),
    this.quote_column_name( column )
  );
};

/**
 * Возвращает sql запрос для переименования столбца в таблице
 *
 * @param {String} table Название таблицы
 * @param {String} name Название столбца
 * @param {String} new_name Новое название столбца
 * @returns {String}
 */
DbSchema.prototype.rename_column = function ( table, name, new_name ) {
  return "ALTER TABLE %s RENAME COLUMN %s TO %s".format(
    this.quote_table_name( table ),
    this.quote_column_name( name ),
    this.quote_column_name( new_name )
  );
};

/**
 * Возвращает sql запрос для создания индекса по таблице.
 *
 * @param {String} name Название индекса
 * @param {String} table Название таблицы
 * @param {String} column название колонки, по которой нужен индекс. Если колонок несколько их надо указать через запятую
 * @param {Boolean} [unique=false] Уникальность ключа
 * @returns {String}
 */
DbSchema.prototype.create_index = function ( name, table, column, unique ) {
  unique = unique || false;

  var columns = column.split( /\s*,\s*/ ).map( this.quote_column_name, this ).join(',');

  return ( unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX" ) + " %s ON %s (%s)".format(
    this.quote_table_name( name ),
    this.quote_table_name( table ),
    columns
  );
};

/**
 * Возвращает sql запрос для удаления индекса по таблице
 *
 * @param {String} name Название индекса
 * @param {String} table Название таблицы
 * @returns {String}
 */
DbSchema.prototype.drop_index = function ( name, table ) {
  return "DROP INDEX %s ON %s".format(
    this.quote_table_name( name ),
    this.quote_table_name( table )
  );
};

/**
 * Сравнивает названия двух таблиц без учета кавычек и названий баз данных перед ними.
 * @param {String} name1
 * @param {String} name2
 * @returns {Boolean}
 */
DbSchema.prototype.compare_table_names = function ( name1, name2 ) {
  name1 = name1.replace( /["'`]/g, '' );
  name2 = name2.replace( /["'`]/g, '' );

  var pos = name1.lastIndexOf( '.' );
  if ( ~pos ) name1 = name1.substr( pos + 1 );
  pos = name2.lastIndexOf( '.' );
  if ( ~pos ) name2 = name2.substr( pos + 1 );

  return name1 == name2;
};

/**
 * Метод кидает TypeError, потому что должен быть перегружен в наследуемых классах, и должен искать названия всех таблиц в базе.
 *
 * @protected
 * @param {String} schema Название базы данных. Если null - поиск по базе, к которой выполнено подключение.
 * @param {Function} callback принимает два параметра: ошибку в случае неудачи, и массив имен таблиц
 */
DbSchema.prototype._find_table_names = function ( schema, callback ) {
  throw new Error( '`%s` does not support fetching all table names.'.format( this.class_name ) );
};

/**
 * Метод кидает TypeError, потому что должен быть перегружен в наследуемых классах, и должен загружать таблицу из базы.
 *
 * @protected
 * @param {String} name Название таблицы.
 * @param {Function} callback принимает два параметра: ошибку в случае неудачи, и схему загруженной таблицы
 */
DbSchema.prototype._load_table = function ( name, callback ) {
  throw new Error( 'You must implement `_load_table` method in `%s`'.format( this.class_name ) );
};
