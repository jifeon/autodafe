module.exports = Listener.inherits( process.EventEmitter );


/**
 * Специальная утилита для работы с асинхронным кодом
 *
 * Утилита используется в том случае когда вам надо выполнить несколько действий параллельно и оперировать их
 * результатами после их окончания. Также утилита позволяет удобно обрабатывать ошибки.
 *
 * @constructor
 * @extends process.EventEmitter
 * @example Обычное использование
 *
 * <pre><code class="javascript">
 * // создание инструмента
 * var listener = new global.autodafe.lib.Listener;
 *
 * var emitter1 = new process.EventEmitter;    // добавляем эмиттер в очередь
 * listener.handle_emitter( emitter1 );
 *
 * var emitter2 = new process.EventEmitter;    // тоже самое что и с первым эмиттером, но другой синтаксис
 * listener.stack <<= emitter2;
 *
 * async_function( listener.get_callback() );  // передаем в функцию специальный колбэк
 *
 * // определяем функцию, которая должна вызваться после успешного окончания всех асинхронных действий
 * // аргументы в функции идут в той последовательности, в которой создавались эмиттеры и колбэки
 * listener.success( function( result1, result2, result_from_callback ){
 *   // код в этом месте будет выполнен, только в том случае, если все асинхронные операций были выполнены удачно
 * });
 *
 * // определяем функцию, которая будет выполнена при возникновении ошибки
 * listener.error(function(e){
 *   // обрабатываем ошибку
 * });
 * </code></pre>
 *
 * Эмиттеры добавленные в listener могут вызывать не только стандартные действия "success" и "error", но и любые другие,
 * которые тоже могут завершать выполнение этих действий. Рассмотрим пример, когда эмиттеры могут вызывать действие
 * "stop" с аргументом reason: <code>emitter.emit('stop', 'timeout')</code>
 *
 * <pre><code class="javascript">
 * // в таком случае для listener обпределяется обработчик этого действия, который прерывает всю цепочку подобно ошибке
 * listener.behavior_for( 'stop', function(reason){  } );
 * </code></pre>
 */
function Listener() {
  this._init();
}


/**
 * @event
 * @name Listener#success
 * @description Все асинхронные операции выполнены
 *
 * Аргументы те же, что и в {@link Listener.handle_success}
 * @see Listener.handle_suceess
 * @see Listener.success
 */


/**
 * @event
 * @name Listener#error
 * @description Одно из асинхронных действий вызвало ошибку
 * @param {Error} e
 * @see Listener.handle_error
 * @see Listener.error
 */


/**
 * Содержит ссылку на текущий {@link Listener.__stack}
 *
 * Применяется для осуществления синтаксиса <code>listener.stack <<= emitter;</code>
 *
 * @type {null|Object}
 * @private
 */
Listener.__current_stack = null;


/**
 * Ссылка на потенциально добавляемый в стек эмиттер
 *
 * Применяется для осуществления синтаксиса <code>listener.stack <<= emitter;</code>
 *
 * @type {null|process.EventEmitter}
 * @private
 */
Listener.__emitter       = null;


// когда эмиттер учавствует в операции <code>listener.stack <<= emitter;</code>, он помещается в Listener.__emitter, для
// последующего Listener.handle_emitter
process.EventEmitter.prototype.valueOf = function(){
  Listener.__emitter = this;
  return Object.prototype.valueOf.call( this );
}


/**
 * Инициализация Listener
 *
 * @private
 */
Listener.prototype._init = function(){
  /**
   * Хранилище поведений
   *
   * Хэш хранит нестандартные поведения для эмиттеров. Нестандартнми являются все кроме событий "success" и "error".
   * Поведения для нестандартных событий осуществляется через метод {@link Listener.behavior_for}. Ключи - названия
   * действий, значения - функции обработчики
   *
   * @type {Object}
   */
  this.behaviors = {};

  /**
   * Хранилище эмиттеров
   *
   * Используется для того, чтобы вновь добавленные поведения были применены к уже существующим эмиттерам. Ключи - номер
   * добавления эмиттера (см. {@link Listener._arg_num}), значения - эмиттеры.
   *
   * @type {Object}
   * @private
   */
  this._emitters  = {};

  /**
   * Количество асинхронных операций на выполнении
   *
   * Счетчик увеличивается во время добавления эмиттеров и создания колбэков, и уменьшая при успешном завершении той или
   * иной асинхронной операции
   *
   * @type {Number}
   */
  this.count     = 0;

  /**
   * Аргументы для успешного окончания
   *
   * Массив, в который собираются аргументы, которые будут переданы в функцию после успешного окончания всех асинхронных
   * действий. Аргументы помещаются в том же порядке, в котором были созданы колбэки и добавленны эмиттеры
   *
   * @type {Array}
   * @private
   */
  this._args     = [];

  /**
   * Счетчик операций
   *
   * Содержит номер аргумента для которого создается операция
   *
   * @type {Number}
   * @private
   */
  this._arg_num  = 0;

  /**
   * Номер первого аргумента
   *
   * Так как может возникнуть ситуация, что один и тотже listener используется несколько раз, то завершающиеся например
   * эмиттеры из прошлого использония не должны влиять на текущие аргументы. Для этого сохраняется номер первого
   * агрумента, а операции с номером меньшим игнорируются.
   *
   * @type {Number}
   * @private
   */
  this._arg_0    = 0;

  this._init_stack();
}


/**
 * Инициализация {@link Listener.stack}
 *
 * @private
 */
Listener.prototype._init_stack = function(){
  /**
   * Вспомогательный объект для реализации {@link Listener.stack}
   *
   * @type {Object}
   * @private
   */
  this.__stack = {
    valueOf : function(){
      Listener.__current_stack = this;
      return 0;
    }
  };

  /**
   * Объект помогающий реализовать синтаксис, где эмиттеры визуально добавляются в некий стэк
   *
   * @field
   * @name stack
   */
  Object.defineProperty( this, 'stack', {
    get : function(){
      return this.__stack;
    },

    set : function(){
      if ( !Listener.__emitter || Listener.__current_stack != this.__stack ) return false;

      var emitter = Listener.__emitter;
      Listener.__emitter = null;
      this.handle_emitter( emitter );
    }
  } );
}


/**
 * Добавляет эмиттер на прослушку
 *
 * @param {process.EventEmitter} emitter
 * @return {Listener} this
 */
Listener.prototype.handle_emitter = function( emitter ){
  this.count++;

  var n = this._arg_num++;
  emitter.on( 'success', this._handle_success.bind( this, n ));
  emitter.on( 'error',   this._handle_error.bind( this, n ));

  for ( var action in this.behaviors ){
    emitter.on( action, this._run_behavior.bind( this, action, n ) );
  }

  this._emitters[ n ] = emitter;
  return this;
}


/**
 * Создает и возвращает колбэк для асинхронной функции
 *
 * @return {Function}
 */
Listener.prototype.get_callback = function(){
  var self = this;
  this.count++;

  var n = this._arg_num++;
  return this._listener_callback.bind( this, n );
}


/**
 * Определяет поведение для нестандартных действий, вызываемых эмиттерами
 *
 * @param {String} action название действия
 * @param {Function} cb функция, которая выполнится если хотя бы один из эмиттеров вызовет это действие
 * @return {Listener} this
 */
Listener.prototype.behavior_for = function( action, cb ){
  this.behaviors[ action ] = cb;

  for ( var n in this._emitters ){
    this._emitters[n].on( action, this._run_behavior.bind( this, action, n ) );
  }

  return this;
}


/**
 * Стандартная обработка всех созданных колбэков
 *
 * Именно эта функция возвращается в {@link Listener.get_callback}
 *
 * @param {Number} n номер аргумента
 * @param {Error|null} e ошибка
 * @param {*} res результат
 * @private
 */
Listener.prototype._listener_callback = function( n, e, res ){
  if (e) this._handle_error(n, e);
  else   this._handle_success(n, res);
}


/**
 * Функция обработки ошибок
 *
 * Сбрасывает настройки лисенера, вызывает {@link Listener.handle_error} и {@link Listener#event:error}
 *
 * @param {Number} n номер аргумента
 * @param {Error} e ошибка
 * @private
 */
Listener.prototype._handle_error = function( n, e ){
  if ( !this._check_arg_num(n) ) return;

  this.reset();
  this.handle_error( e );

  if ( this.listeners('error').length ) this.emit( 'error', e );
}


/**
 * Функция обработки успешного завершения
 *
 * Записывает аргументы из результатов асинхронных действий, а после выполнения последнего вызывает
 * {@link Listener.handle_success} и {@link Listener#event:success}
 *
 * @param {Number} n номер аргумента
 * @param {*} res результат
 * @private
 */
Listener.prototype._handle_success = function( n, res ){
  if ( !this._check_arg_num(n) ) return;

  this._args[n - this._arg_0] = res;
  if ( --this.count ) return;

  var args = this._args.slice(0);

  this.reset();
  this.handle_success.apply( this, args );

  args.unshift( 'success' );
  this.emit.apply( this, args );
}


/**
 * Запускает поведение лоя нестандартного действия
 *
 * @param {String} action название действия
 * @param {Number} n номер аргумента
 * @private
 */
Listener.prototype._run_behavior = function( action, n ){
  if ( !this._check_arg_num(n) ) return;

  this.reset();
  this.behaviors[ action ].apply( null, Array.prototype.slice.call( arguments, 2 ));
}


/**
 * Сбрасывает настройки лисенера и готовит его к повторному использованию
 *
 * @return {Listener} this
 */
Listener.prototype.reset = function(){
  this.count     = 0;
  this._arg_0    = this._arg_num;
  this._args     = [];
  this._emitters = {};
  return this;
}


/**
 * Проверяет номер аргумента.
 *
 * Некоторые действия могут завршиться уже после отлова ошибки в одном из асинхронных действий. А листенер к этому
 * моменту уже может быть занят другими действиями. Для этого перед обработкой действий выполняется проверка номера
 * аргумента
 *
 * @param {Number} n номер аргумента
 * @return {Boolean} годен ли аргумент
 * @private
 */
Listener.prototype._check_arg_num = function( n ){
  return n >= this._arg_0;
}


/**
 * Метод вызывается при получении ошибки.
 *
 * Метод можно переопределять в наследуемых классах. Также этот метод можно задать через {@link Listener.error}
 *
 * @param {Error} e
 */
Listener.prototype.handle_error = function( e ){}


/**
 * Метод вызывается после успешного выполнения всех действий
 *
 * Метод можно переопределять в наследуемых классах. Также этот метод можно задать через {@link Listener.success} В
 * параметрах передаются скопленные аргументы {@link Listener._args}
 */
Listener.prototype.handle_success = function(){}


/**
 * Задает {@link Listener.handle_success}
 *
 * @param {Function} f
 * @return {Listener} this
 */
Listener.prototype.success = function( f ){
  this.handle_success = f;
  return this;
};


/**
 * Задает {@link Listener.handle_error}
 *
 * @param {Function} f
 * @return {Listener} this
 */
Listener.prototype.error = function( f ){
  this.handle_error = f;
  return this;
}