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
  if ( !Array.isArray( tables ) ) tables = Array.prototype.slice.call( arguments, 0 );

  tables.forEach( function( table ){
    this._tables[ table ] = true;
  }, this );
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
  if ( !Array.isArray( tables ) ) tables = Array.prototype.slice.call( arguments, 0 );

  tables.forEach( function( table ){
    delete this._tables[ table ];
  }, this );
};


/**
 * Соединяет таблицы и возвращает новый DbCriteriaSelectedTables
 *
 * @param {String[]|DbCriteriaSelectedTables} tables
 * @returns {DbCriteriaSelectedTables}
 * <pre><code class="javascript">
 * tables.merge_with( new DbCriteriaSelectedTables( 'table2', 'table3', 'table4' ); )
 * tables.merge_with( 'table2', 'table3', 'table4' );                           // делает тоже самое
 * tables.merge_with( ['table2', 'table3', 'table4'] );                           // делает тоже самое
 * </code></pre>
 */
DbCriteriaSelectedTables.prototype.merge_with = function( tables ){
  if ( this.constructor.is_instantiate( tables ) ) tables = tables.get_tables();
  else if ( !Array.isArray( tables ) ) tables = Array.prototype.slice.call( arguments, 0 );

  var new_tables = new DbCriteriaSelectedTables( this.get_tables() );
  new_tables.add_tables( tables );

  return new_tables;
};