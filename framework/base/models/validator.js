module.exports = Validator.inherits( global.autodafe.AppModule );

/**
 * Класс, содержащий методы для валидации моделей.
 *
 * @param {Object} params см. {@link AppModule}
 * @constructor
 * @see Model.validate
 */
function Validator( params ) {
  this._init( params );
}


/**
 * Инициализация валидатора
 *
 * @param {Object} params см. {@link AppModule}
 * @private
 */
Validator.prototype._init = function ( params ) {
  Validator.parent._init.call( this, params );

  /**
   * Регулярное выражение для проверки электронных адресов
   *
   * @type {RegExp}
   * @private
   */
  this._email   = /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i;

  /**
   * Регулярное выражение для проверки URL
   *
   * @type {RegExp}
   * @private
   */
  this._url     = /(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

  /**
   * Регулярное выражение для проверки выражений, состоящих только из латинских букв
   *
   * @type {RegExp}
   * @private
   */
  this._letters = /^[a-zA-Z]*$/;

  /**
   * Регулярное выражение для проверки телефонных номеров
   *
   * @type {RegExp}
   * @private
   */
  this._phone   = /^[0-9#\-+() ]*$/;
}


/**
 * Проверяет переданное значение на неравенство null
 *
 * @param {String} field Имя проверяемого поля
 * @param {*} value Значение поля
 * @param {Boolean} required Является ли поле обязательным
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.required = function( field, value, required, error ){
  if ( value || value === false || !required ) return null;

  return this.t( error || 'This field is required' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value
  });
}


/**
 * Проверяет переданное значение на минимальное количество элементов в нем
 *
 * @param {String} field Имя проверяемого поля
 * @param {String|Array} value Значение поля
 * @param {Number} length Минимальная длина
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {length} на минимально возможное количество
 * элементов
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.min_length = function ( field, value, length, error ){
  if ( !value || value.length >= length ) return null;

  return this.t( error || 'Please enter at least {length} characters' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value,
    '{length}'  : length
  });
}


/**
 * Проверяет переданное значение на максимальное количество элементов в нем
 *
 * @param {String} field Имя проверяемого поля
 * @param {String|Array} value Значение поля
 * @param {Number} length Максимальная длина
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {length} на максимально возможное количество
 * элементов
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.max_length = function ( field, value, length, error ){
  if( !value || value.length <= length ) return null;

  return this.t( error || 'Please enter no more than {length} characters' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value,
    '{length}'  : length
  });
}


/**
 * Проверяет переданное значение на количество элементов в нем
 *
 * @param {String} field Имя проверяемого поля
 * @param {String|Array} value Значение поля
 * @param {Number[]} range Массив из двух элементов. первый - минимально возможное количество элементов, второй -
 * максимально возможное
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {min_length} на минимально возможное
 * количество элементов, {max_length} на максимально возможное количество элементов
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.range_length = function( field, value, range, error ){
  if ( !value || !Array.isArray( range ) || range.length != 2 || value.length >= range[0] && value.length <= range[1] )
    return null;

  return this.t( error || 'Please enter a value between {min_length} and {max_length} characters long' ).format({
    '{field}'       : this.t( field ),
    '{value}'       : value,
    '{min_length}'  : range[0],
    '{max_length}'  : range[1]
  });
};


/**
 * Проверяет переданное значение на то, чтобы оно было не менее определенного числа
 *
 * @param {String} field Имя проверяемого поля
 * @param {Number} value Значение поля
 * @param {Number} min Минимально возможное значение
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {min} - минимальное значение
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.min = function( field, value, min, error ){
  var n = Number( value );
  if( !value || n >= min ) return null;

  return this.t( error || 'Please enter a value greater than or equal to {min}' ).format({
    '{field}' : this.t( field ),
    '{value}' : value,
    '{min}'   : min
  });
};


/**
 * Проверяет переданное значение на то, чтобы оно было не более определенного числа
 *
 * @param {String} field Имя проверяемого поля
 * @param {Number} value Значение поля
 * @param {Number} max Максимально возможное значение
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {max} - максимальное значение
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.max = function( field, value, max, error ){
  var n = Number( value );
  if( !value || n <= max ) return null;

  return this.t( error || 'Please enter a value less than or equal to {max}' ).format({
    '{field}' : this.t( field ),
    '{value}' : value,
    '{max}'   : max
  });
};


/**
 * Проверяет переданное значение на то, чтобы оно пренадлежало переданному промежутку чисел
 *
 * @param {String} field Имя проверяемого поля
 * @param {Number} value Значение поля
 * @param {Number[]} range массив из 2х элементов, первый минимальное значение, второй - максимальное
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {min} - минимальное значение, {max} -
 * максимальное значение
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.range = function( field, value, range, error ){
  var n = Number( value );
  if ( !value || !Array.isArray( range ) || range.length != 2 || n >= range[0] && n <= range[1] )
    return null;

  return this.t( error || 'Please enter a value between {min} and {max}' ).format({
    '{field}' : this.t( field ),
    '{value}' : value,
    '{min}'   : range[0],
    '{max}'   : range[1]
  });
};


/**
 * Проверяет переданное значение на кооректный email адрес
 *
 * @param {String} field Имя проверяемого поля
 * @param {String} value Значение поля
 * @param {Boolean} need_check Необходимо ли выполнять проверку
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.email = function ( field, value, need_check, error ){
  if( !value ||  !need_check || this._email.test( value ) ) return null;

  return this.t( error || 'Please enter a valid email address' ).format( {
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


/**
 * Проверяет переданное значение на то, чтобы оно состояло только из букв
 *
 * @param {String} field Имя проверяемого поля
 * @param {String} value Значение поля
 * @param {RegExp|Boolean} re Должно быть true или альтернативным регулярным выражением, проверяющим текст на наличие
 * в нем только букв, регулярное выражение используещееся по умолчанию, проверяет на наличие только латинских букв в
 * выражении
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.letters_only = function ( field, value, re, error ){
  if ( !re ) return null;
  re = re instanceof RegExp ? re : this._letters;

  if( re.test( value )) return null;

  return this.t( error || 'Please enter only letters' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


/**
 * Проверяет переданное значение на соответствие md5 хэшу
 *
 * @param {String} field Имя проверяемого поля
 * @param {String} value Значение поля
 * @param {Boolean} need_check Необходимо ли выполнять проверку
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.md5 = function( field, value, need_check, error ){
  if ( !value || /^[a-f0-9]{32}$/.test( value ) ) return null;

  return this.t( error || 'Field {field} should be md5 hash' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


/**
 * Проверяет переданное значение на равенство одному из элементов переданного массива
 *
 * @param {String} field Имя проверяемого поля
 * @param {*} value Значение поля
 * @param {Array} array Масси допустимых значений
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {values} на допустимые значения,
 * перечисленные через запятую
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.in_array = function( field, value, array, error ){
  if ( !value || !array || !Array.isArray( array ) || ~array.indexOf( value ) ) return null;

  return this.t( error || 'This field should be equal to one of that values: {values}' ).format({
    '{field}'   : this.t( field ),
    '{value}'   : value,
    '{values}'  : array.join(', ')
  });
}


/**
 * Проверяет, является ли переданное значение числом
 *
 * @param {String} field Имя проверяемого поля
 * @param {*} value Значение поля
 * @param {Boolean} need_check Необходимо ли выполнять проверку
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.number = function( field, value, need_check, error ){
  if ( value === '' || !need_check || isFinite( value ) ) return null;

  return this.t( error || 'Please enter a valid number' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
}


/**
 * Проверяет, является ли переданное значение телефонным номером
 *
 * @param {String} field Имя проверяемого поля
 * @param {String} value Значение поля
 * @param {RegExp|Boolean} re Должно быть true или альтернативным регулярным выражением, проверяющим соответствие текста
 * телефонному номеру, регулярное выражение используещееся по умолчанию, проверяет на наличие только следующих символов:
 * цифр, круглых скобок,+ - # и пробел
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.phone_number = function ( field, value, re, error ) {
  if ( !re ) return null;
  re = re instanceof RegExp ? re : this._phone;

  if( re.test( value )) return null;

  return this.t( error || 'Please enter a valid phone number' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
};


/**
 * Проверяет, является ли переданное значение валидным URL
 *
 * @param {String} field Имя проверяемого поля
 * @param {String} value Значение поля
 * @param {Boolean} need_check Необходимо ли выполнять проверку
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.url = function ( field, value, need_check, error ) {
  if ( !value || !need_check || this._url.test( value ) ) return null;

  return this.t( error || 'Please enter a valid URL' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
};


/**
 * Проверяет переданное значение на совпадение переданному регулярному выражению
 *
 * @param {String} field Имя проверяемого поля
 * @param {String} value Значение поля
 * @param {RegExp} re Регулярное выражение
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.match = function ( field, value, re, error ) {
  if ( !value || ( new RegExp(re) ).test( value ) ) return null;

  return this.t( error || 'Please enter a valid value' ).format({
    '{field}' : this.t( field ),
    '{value}' : value
  });
};


/**
 * Проверяет переданное значение на равенство другому значению
 *
 * @param {String} field Имя проверяемого поля
 * @param {*} value Значение поля
 * @param {*} expected Сравниваемое значение
 * @param {String} [error] Альтернативная ошибка, которая вернется при непройденной валидации. В тексе заменяться
 * следущие подстроки: {field} на название поля, {value} на значение поля, {expected} на сравниваемое значение
 * @return {String|Null} Текст ошибки
 */
Validator.prototype.equal = function( field, value, expected, error ){
  if ( !value || value == expected ) return null;

  return this.t( error || 'Value should be equal to {expected}' ).format({
    '{field}'     : this.t( field ),
    '{value}'     : value,
    '{expected}'  : expected
  });
};
