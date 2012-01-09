var ProtectedValuesProxyHandler = require( '../lib/proxy_handlers/protected_values_proxy_handler' );

module.exports = AutodafePart.inherits( process.EventEmitter );


/**
 * Базовый класс для большинства классов фреймворка. Обеспечивает легкое задание защищенных от записи и удаления
 * свойств. Позволяем менять им геттеры и сеттеры.
 *
 * @constructor
 * @extends process.EventEmitter
 */
function AutodafePart() {
  this._init();
}


/**
 * Инициализация AutodafePart
 *
 * @private
 */
AutodafePart.prototype._init = function() {
  var handler = new ProtectedValuesProxyHandler( {
    target : this
  } );

  /**
   * Свойство, позволяющее задавать защищенные свойства.
   *
   * _ (подчеркивание) - это геттер, возвращающий
   * <a href="https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Proxy">Proxy</a> использующий
   * {@link ProtectedValuesProxyHandler}
   *
   * @field
   * @name _
   * @public
   * @type {Proxy}
   * @example Создание защищенных свойств.
   *
   * Внимание! Задание защищенных свойств частично необратимо ( удалить защищенные переменные полностью невозможно )
   *
   * <pre><code class="javascript">
   * var AutodafePart = require('autodafe_part');
   *
   * module.exports = MyClass.inherits( AutodafePart );
   *
   * function MyClass() {
   *   this._init();
   * }
   *
   * MyClass.prototype._init = function() {
   *   this.super_._init();
   *
   *   this.simple_prop = 5;       // создание простого свойства
   *   this._.protected_prop = 6;  // создание защищенного свойства
   * }
   *
   * var inst = new MyClass;
   *
   * inst.simple_prop;             // считываем 5
   * inst.simple_prop = 8;         // записываем 8
   * delete inst.simple_prop;      // вернет true - свойство можно удалить
   *
   * inst.protected_prop;          // вернет 6 - считываение свойства
   * inst.protected_prop = 8;      // кидает TypeError
   * delete inst.protected_prop;   // возвращает false - удаления не происходит
   *
   * inst._.protected_prop = 8;    // перезадает свойство.
   * inst._.protected_prop;        // возвращает дескриптор для данного свойства ( см. ссылку под примером )
   *
   * // можно перезадать getter и setter для свойства, внутри функций this указывает на дескрипто свойства
   * // при перезадании свойства ( как в 26 строке ) getter и setter сбрасываются
   * // внутри getter'a и setter'а this указывает на inst
   * inst._.protected_prop.set = function( value, descriptor ) {}   // таким образом можно перезадать setter свойства
   * inst._.protected_prop.get = function( descriptor ) {           // таким образом можно перезадать getter свойства
   *   return 1;
   * }
   *
   * // удаление
   * delete inst._.protected_prop; // вернет true, произойдет эмитация удаления свойства - значение сбросится в undefined,
   *                               // задание и считывание свойства будут происходить как у обычного свойства, но попытка
   *                               // удаления свойства ( delete inst.protected_prop ) все равно будет возвращать false и
   *                               // ничего не делать
   *
   * delete inst._;                // возвращает false - подчеркивание удалить нельзя ( как и перезадать )
   * </code></pre>
   * @see {@link ProtectedValuesDescriptor} описание дескриптора
   */
  Object.defineProperty( this, '_', {
    value         : handler.get_proxy(),
    writable      : false,
    configurable  : false
  } );

  /**
   * Имя класса, взятое как this.constructor.name
   *
   * Имя класса экземпляр которого мы исследуем. Имя определяется как имя конструктора ( instance.contructor.name ),
   * поэтому необходимо чтобы все классы наследуемые от AutodafePart были объявлены как функции имеющие имя.
   *
   * @type {String}
   * @example
   * <pre><code class="javascript">
   * module.exports = MyClass.inherits( autodafe.AutodafePart );
   *
   * function MyClass() {
   *   this._init();
   * }
   *
   * var instance = new MyClass;
   * console.log( instance.class_name );     // выведет в консоль "MyClass"
   * </code></pre>
   */
  this._.class_name = this.constructor.name;
};