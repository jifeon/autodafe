var Component = global.autodafe.Component;

module.exports = MyTools.inherits( Component ); // наследуем от Component

/**
 * Пользовательский компонент расширяющий возможности dust
 *
 * @constructor
 * @param {Object} params параметры для компонента, задаются в конфигурационном файле
 */
function MyTools( params ) {
  this._init( params );
}

/**
 * Инициализация компонента
 *
 * @param {Object} params
 */
MyTools.prototype._init = function ( params ) {
  // Вызов инициализации родительского класса
  MyTools.parent._init.call( this, params );

  /**
   * Добавляем фильтр для dust преобразующий дату в читабельное значение
   *
   * @param {Date} value
   * @return {String}
   */
  this.app.tools.dust.filters.local_date = function( value ){
    if ( !( value instanceof Date ) ) return value;

    return value.toLocaleDateString();
  };

  /**
   * Добавляем фильтр для dust преобразующий переносы строк в тег <br/>
   *
   * @param {String} value
   * @return {String}
   */
  this.app.tools.dust.filters.n2br = function( value ){
    return value.replace( /\r\n|\r|\n/g, '<br/>' );
  };
};