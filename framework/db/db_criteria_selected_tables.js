module.exports = DbCriteriaSelectedTables;


/**
 * Класс для работы с {@link DbCriteria.select}
 *
 * @constructor
 * @example Создание и использование
 * <pre><code class="javascript">
 * var tables = new DbCriteriaSelectedTables( 'table1', 'table2' );
 * var tables = new DbCriteriaSelectedTables( ['table1', 'table2'] );           // тоже самое
 *
 * tables.get_tables();                         // returns [ 'table1', 'table2' ]
 *
 * tables.add_tables( 'table1', 'table3' );
 * tables.add_tables( ['table1', 'table3'] );   // тоже самое
 * tables.get_tables();                         // returns [ 'table1', 'table2', 'table3' ]
 *
 * tables.remove_tables( 'table2' );
 * tables.remove_tables( [ 'table2' ] );        // тоже самое
 * tables.get_tables();                         // returns [ 'table1', 'table3' ]
 *
 * // returns new DbCriteriaSelectedTables with merged tables
 * tables.merge_with( new DbCriteriaSelectedTables( 'table2', 'table3', 'table4' ); )
 * tables.merge_with( 'table2', 'table3', 'table4' );                           // делает тоже самое
 * </code></pre>
 */
function DbCriteriaSelectedTables() {
  this._init.apply( this, arguments );
}


/**
 * Инициализация DbCriteriaSelectedTables
 *
 * @private
 */
DbCriteriaSelectedTables.prototype._init = function() {
  this._tables = {};

  this.add_tables.apply( this, arguments );
};


/**
 * Добавляет таблицы
 *
 * @param {String[]} tables
 * @example
 * <pre><code class="javascript">
 * tables.add_tables( 'table1', 'table3' );
 * tables.add_tables( ['table1', 'table3'] );   // тоже самое
 * </code></pre>
 */
DbCriteriaSelectedTables.prototype.add_tables = function( tables ){
  this._get_tables_from_args( arguments ).forEach(function( table ){
    this._tables[ table ] = true;
  }, this);
};


/**
 * Возвращает список таблиц
 *
 * @returns {String[]}
 */
DbCriteriaSelectedTables.prototype.get_tables = function(){
  return Object.keys( this._tables );
};


/**
 * Удаляет таблицы
 *
 * @param {String[]} tables
 * @example
 * <pre><code class="javascript">
 * tables.remove_tables( 'table2' );
 * tables.remove_tables( [ 'table2' ] );        // тоже самое
 * </code></pre>
 */
DbCriteriaSelectedTables.prototype.remove_tables = function( tables ){
  this._get_tables_from_args( arguments ).forEach(function( table ){
    delete this._tables[ table ];
  }, this);
};


DbCriteriaSelectedTables.prototype.clean = function(){
  this._tables = {};
};


/**
 * Соединяет таблицы и возвращает новый DbCriteriaSelectedTables
 *
 * @param {String[]|DbCriteriaSelectedTables} tables
 * @returns {DbCriteriaSelectedTables}
 * <pre><code class="javascript">
 * tables.merge_with( new DbCriteriaSelectedTables( 'table2', 'table3', 'table4' ); )
 * tables.merge_with( 'table2', 'table3', 'table4' );                           // делает тоже самое
 * tables.merge_with( ['table2', 'table3', 'table4'] );                         // делает тоже самое
 * </code></pre>
 */
DbCriteriaSelectedTables.prototype.merge_with = function( tables ){
  if ( !tables ) return this;

  if ( this._tables['*'] ) {
    this.clean();
    this.add_tables.apply( this, arguments );
  }

  else if ( tables.toString() != '*' )
    this.add_tables.apply( this, arguments );

  return this
};


DbCriteriaSelectedTables.prototype.toString = function(){
  return this.get_tables().join(', ')
};


DbCriteriaSelectedTables.prototype._get_tables_from_args = function( args ){
  var tables = args[0];

  if (tables instanceof this.constructor) return tables.get_tables();

  if ( !Array.isArray( tables ) ) tables = Array.prototype.slice.call( args, 0 );

  var separated_tables = [];
  tables.forEach( function( table ){
    separated_tables.push.apply( separated_tables, table.split(/\s*,\s*/) );
  } );

  return separated_tables;
};