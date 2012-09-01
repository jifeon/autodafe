var crypto     = require( 'crypto' );

module.exports = Model.inherits( global.autodafe.AppModule );

/**
 * Базовый класс для всех моделей в приложении, обеспечивает удобную работы с атрибутам - специальными свойствами
 * модели. Имеет инструменты для множественного задание и фильтрации атрибутов, валидации, сравнения и сохранения
 * моделей.
 *
 * @param {Object} params параметры для инициализации модели
 * @constructor
 * @extends AppModule
 */
function Model( params ) {
  this._init( params );
}


/**
 * Набор фильтров, которые можно употреблять в секциях prefilters и postfilters в описании атрибутов (cм.
 * {@link Model.attributes})
 *
 * @type {Object}
 * @static
 * @property {Function} md5 Преобразует значение атрибута в md5 хэш
 * @property {Function} trim Удаляет у атрибута крайние пробелы
 */
Model.prototype.native_filters = {
  md5 : function( v ){
    return crypto.createHash('md5').update( v ).digest("hex");
  },
  trim : function( v ){
    return typeof v == 'string' ? v.trim() : v;
  }
}


/**
 * Инициализирует модель
 *
 * @param {Object} params параметры для инициализации, описаны в {@link Model}
 * @private
 */
Model.prototype._init = function ( params ) {
  Model.parent._init.call( this, params );

  /**
   * Объект хранящий ошибки валидации модели в виде {'название атрибута' : 'текст ошибки'}
   *
   * @type {Object}
   * @private
   * @see Model.get_errors
   * @see Model.has_errors
   * @see Model.validate
   * @see Model.validate_attribute
   */
  this._errors      = {};

  /**
   * Имена всех атрибутов модели
   *
   * @type {String[]}
   * @private
   * @see Model.get_attributes_names
   */
  this._attributes  = [];

  /**
   * Имена всех ключевых атрибутов
   *
   * @type {String[]}
   * @private
   * @see Model.is_key_attribute
   * @see Model.equals
   * @see Model.get_id
   */
  this._keys        = [];

  /**
   * Алиас для {@link Application.models}, прокси для {@link ModelsManager}
   *
   * @type {Proxy}
   */
  this.models       = this.app.models;

  /**
   * Признак того, что модель инициализирована. Может использоваться при асинхронной загрузке моделей. Подробнее см. в
   * {@link ModelsManager.load_models}
   *
   * @type {Boolean}
   */
  this.is_inited    = true;

  this._process_attributes();
};


/**
 * Создает атрибуты ({@link Model.create_attribute}) по их описаниям, полученным из {@link Model.attributes}
 *
 * @private
 */
Model.prototype._process_attributes = function(){
  var descriptions = this.app.tools.to_object( this.attributes(), 1 );

  for ( var attr in descriptions ) {
    this.create_attribute( attr, descriptions[attr] );
  }
};


/**
 * Функция возвращающая описание атрибутов. Должна быть переопределена в наследуемых классах.
 *
 * @return {Object}
 * @example Описание атрибутов
 * <pre><code class="javascript">
 * User.prototype.attributes = function( params ) {
 *   return {
 *     id       : 'key number',
 *     login : {
 *       safe         : true,
 *       required     : true,
 *       range_length : [4, 20],
 *       prefilters   : 'trim',
 *       errors       : {
 *         required   : '{field} required'
 *       }},
 *
 *     password  : ['safe required', {
 *       min_length  : 6,
 *       postfilters : ['md5', function(v){ return v.slice(1); }],
 *       errors      : {
 *         min_length : 'Field {field} should have {length} ch.'
 *       }
 *     }],
 *     email     : {
 *       'safe required email' : true,
 *       errors : {
 *         email : 'Please enter email instead of "{value}"'
 *       }
 *     }
 *   };
 * };
 * </code></pre>
 */
Model.prototype.attributes = function(){
  return {};
};


/**
 * Возвращает имена атрибутов
 *
 * @param {String[]|String} [names] Если параметр указан - вернет пересечение между атрибутами и указанными именами
 * @return {String[]}
 * @example Пример использования
 * <pre><code class="javascript">
 * model.get_attributes();                             // [ 'login', 'email', 'password' ]
 * model.get_attributes( 'login, email, site' );       // [ 'login', 'email' ]
 * model.get_attributes( ['login', 'email', 'site'] ); // [ 'login', 'email' ]
 * </code></pre>
 */
Model.prototype.get_attributes_names = function( names ){
  if ( typeof names == 'string' ) names = names.split(/\s*,\s*/);
  if ( !Array.isArray( names ) )  return this._attributes.slice(0);

  return names.filter( this.is_attribute.bind( this ) );
};


/**
 * Проверяет является ли указанная строка названием атрибута
 *
 * @param {String} attr предпологаемое название атрибута
 * @return {Boolean}
 */
Model.prototype.is_attribute = function( attr ){
  return !!~this._attributes.indexOf( attr );
};


/**
 * Создает атрибут по описанию
 *
 * @param {String} attr имя атрибута
 * @param {Boolean|Object} description описание атрибута
 * @return {Boolean} Создан ли атрибут
 * @see Model.attributes
 */
Model.prototype.create_attribute = function( attr, description ){
  if ( !description ) return false;

  this._[ attr ].get = function( descriptor ){
    return this.get_attribute( descriptor.name );
  }

  this._[ attr ].set = function( value, descriptor ){
    this.set_attribute( descriptor.name, value );
  }

  description = this.app.tools.to_object( description, 1 );

  // check for safe attribute, alternative errors and filters
  [ 'safe', 'errors', 'prefilters', 'postfilters' ].forEach(function( rule ){
    if ( description[ rule ] ) {
      this._[ attr ].params[ rule ] = description[ rule ];
      delete description[ rule ];
    }
  }, this);

  if ( description['key'] ) {
    this._keys.push( attr );
    delete description['key'];
  }

  this._[ attr ].params.validation_rules = description;
  this._attributes.push( attr );

  return true;
};


/**
 * Удаляет атрибут
 *
 * @param {String} attr название атрибута
 * @return {Model}
 */
Model.prototype.remove_attribute = function( attr ){
  if ( !this.is_attribute( attr ) ) return this;

  delete this._errors[ attr ];
  this._attributes.splice( this._attributes.indexOf( attr ), 1 );
  this._keys.splice( this._keys.indexOf( attr ), 1 );
  delete this._[ attr ];

  return this;
};


/**
 * Возвращает значение атрибута
 *
 * @param {String} name имя атрибута
 * @param {Boolean} [do_filters=true] Применять ли фильтры из секции postfilters в описании атрибутов
 * @return {*}
 */
Model.prototype.get_attribute = function ( name, do_filters ) {
  if ( !this.is_attribute( name ) ) return undefined;

  var descriptor = this._[name];
  var value      = descriptor.value;
  if ( do_filters !== false ) value = this.filter( descriptor.value, descriptor.params['postfilters'] );
  return value === undefined ? null : value;
};


/**
 * Возвращает значение нескольких атрибутов
 *
 * @param {String[]|String} [names] Имена атрибутов, значения которых надо вернуть
 * @param {Boolean} [do_filters=true] Применять ли фильтры из секции postfilters в описании атрибутов
 * @return {Object} Объект в виде {'название атрибута' : 'его значение'}
 * @example Пример использования
 * <pre><code class="javascript">
 * model.get_attributes();                  // { login: 'user', email : 'email', pass : 'pass' }
 * model.get_attributes( 'login, email' );  // { login: 'user', email : 'email' }
 * model.get_attributes( [ 'login' ] );     // { login: 'user' }
 * </code></pre>
 */
Model.prototype.get_attributes = function( names, do_filters ) {
  if ( typeof names == 'string' ) names = names.split(/\s*,\s*/);
  if ( !Array.isArray( names ) )  names = this._attributes;

  var attrs = {};

  names.forEach( function( name ){
    attrs[ name ] = this.get_attribute( name, do_filters );
  }, this );

  return attrs;
};


/**
 * Задание значения атрибута
 *
 * @param {String} name имя атрибута
 * @param {*} value значение атрибута
 * @param {Boolean} [do_filters=true] Применять ли фильтры из секции prefilters в описании атрибутов
 * @return {Model}
 */
Model.prototype.set_attribute = function ( name, value, do_filters ) {
  if ( !this.is_attribute( name ) ) return this;

  var descriptor = this._[name];
  descriptor.value = do_filters !== false
    ? this.filter( value, descriptor.params['prefilters'] )
    : value;

  return this;
};


/**
 * Задание атрибутов скопом. Заданы бубт только те атрибуты, которые помечены в описании как безопасные (safe)
 *
 * @param {Object} attributes Атрибуты, которые необходимо задать в виде {'название атрибута' : 'его значение'}
 * @param {Boolean} [do_filters=true]  Применять ли фильтры из секции postfilters в описании атрибутов
 * @param {Boolean} [forced=false] Если выставить в true будут заданы даже небезопасные атрибуты
 * @return {Model}
 * @see Model.attributes
 */
Model.prototype.set_attributes = function ( attributes, do_filters, forced ) {
  if ( !Object.isObject( attributes ) ) {
    this.log( 'First argument to `%s.set_attributes` should be an Object'.format( this.class_name ), 'warning' );
    return this;
  }

  for ( var attr in attributes ) {
    if ( forced || this.is_safe_attribute( attr ) )
      this.set_attribute( attr, attributes[ attr ], do_filters );
    else
      this.log( '`%s.set_attributes` try to set the unsafe attribute `%s`'.format( this.class_name, attr ), 'warning' );
  }

  return this;
};


/**
 * Сбрасывает значение всех атрибутов в null
 *
 * @param {String[]|String} [names] имена атрибутов, значение которых надо сбросить
 * @return {*}
 * @example Пример использования
 * <pre><code class="javascript">
 * model.clean_attributes();
 * model.clean_attributes( 'login, email' );
 * model.clean_attributes( [ 'login', 'email' ] );
 * </code></pre>
 */
Model.prototype.clean_attributes = function ( names ) {
  if ( typeof names == 'string' ) names = names.split(/\s*,\s*/);
  if ( !Array.isArray( names ) )  names = this._attributes;

  names.forEach(function( attr ){
    this[attr] = null;
  }, this);

  return this;
};


/**
 * Применяет фильтры из {@link Model.native_filters} или переданные в виде функций к значению
 *
 * @param {*} value То что преобразуется
 * @param {Array|Function|String} filters Фильтры
 * @return {*}
 * @example Пример использования
 * <pre><code class="javascript">
 * model.filter( ' text ', 'trim' );
 * model.filter( 'pass', [ 'md5', function( v ){ return v.slice(2); } ] );
 * </code></pre>
 */
Model.prototype.filter = function( value, filters ){
  if ( !filters ) return value;
  if ( !Array.isArray( filters ) ) filters = [filters];
  filters.forEach(function( filter ){
    if ( typeof filter == 'string'   ) filter = this.native_filters[ filter ];
    if ( typeof filter == 'function' ) value = filter( value );
  }, this);

  return value;
};


/**
 * Проверяет, является ли атрибут безопасным (safe)
 *
 * @param {String} name название атрибута
 * @return {Boolean}
 */
Model.prototype.is_safe_attribute = function( name ){
  return this.is_attribute( name ) && !!this._[ name ].params['safe'];
};


/**
 * Проверяет, является ли атрибут ключевым (key)
 *
 * @param {String} name название атрибута
 * @return {Boolean}
 */
Model.prototype.is_key_attribute = function( name ){
  return !!~this._keys.indexOf( name );
};


/**
 * Выполняет валидацию модели и ее последующее сохранение
 *
 * @param {Function} [callback] функция, которая выполнится после сохранения модели. Если никакой функции выполнять не
 * надо, вместо первого параметра можно использовать второй attributes (см. примеры).
 * @param {Error} [callback.error] Системная ошибка возникшая во время валидации или сохранения
 * @param {Error} [callback.model] Сама модель
 * @param {String[]|String} [attributes] если указано, то будут сохранены только эти атрибуты
 * @return {EventEmitter} События: "success" - при успешном сохранении, "error" - при возникновении системной ошибки,
 * "not_valid" - при ошибке валидации
 * @see Model.validate
 * @see Model.forced_save
 * @example Пример использования
 * Используя callback
 * <pre><code class="javascript">
 * model.save( function(e, model){
 * if (e) { обработка системной ошибки }
 *
 * if ( model.has_errors() ) {
 *   var errors = user.get_errors();
 *   // обрабатываем ошибки валидации
 * }
 * else {
 *   // модель сохранена нормально
 * }
 * });
 * </code></pre>
 *
 * Используя EventEmitter
 * <pre><code class="javascript">
 * model.save()
 * .on('error',     function(e) { обработка системной ошибки })
 * .on('not_valid', function(errors) { обработка ошибок валидации })
 * .on('success',   function() { все прошло гладко });
 * </code></pre>
 *
 * Сохраняем определенные атрибуты (callback указывать необязательно)
 * model.save('name, description');
 */
Model.prototype.save = function ( callback, attributes ) {
  var emitter = new process.EventEmitter;
  var self    = this;

  if ( typeof callback != 'function' ) {
    attributes = callback;
    callback   = null;
  }

  this.validate(function( e ){
    if ( e ) return callback && callback( e );
    if ( self.has_errors() ) return callback && callback( null, self );

    self.forced_save( callback, attributes ).re_emit( 'error', 'success', emitter );
  }).re_emit( 'error', 'not_valid', emitter );

  return emitter;
};


/**
 * Сохранение модели, этот метод необходимо переопределить в наследуемых классах
 *
 * @param {Function} [callback] функция, которая выполнится после сохранения модели
 * @param {Error} [callback.error] Системная ошибка возникшая во время сохранения
 * @param {Error} [callback.model] Сама модель
 * @param {String[]|String} [attributes] если указано, то будут сохранены только эти атрибуты
 * @return {EventEmitter} События: "success" - при успешном сохранении, "error" - при возникновении системной ошибки
 * @see model.save
 */
Model.prototype.forced_save = function( callback, attributes ){
  var self    = this;
  var emitter = new process.EventEmitter;

  process.nextTick(function(){
    callback && callback( null );
    emitter.emit( 'success', self );
  });

  return emitter;
};


/**
 * Удаление модели, этот метод необходимо переопределить в наследуемых классах
 *
 * @param {Function} [callback] функция, которая выполнится после удаления модели
 * @param {Error} [callback.error] Системная ошибка возникшая во время удаления
 * @return {EventEmitter} События: "success" - при успешном удалении, "error" - при возникновении системной ошибки
 */
Model.prototype.remove = function ( callback ) {
  var self    = this;
  var emitter = new process.EventEmitter;

  process.nextTick(function(){
    callback && callback( null );
    emitter.emit( 'success', self );
  });

  return emitter;
};


/**
 * Валидация модели. Правила валидации описываются в методе {@link Model.attributes}
 *
 * @param {Function} [callback] функция, которая выполнится после валидации модели
 * @param {Error} [callback.error] Системная ошибка возникшая во время валидации
 * @param {Error} [callback.model] Сама модель
 * @param {String[]|String} [attributes] Если передан, то будут валидированы только эти атрибуты
 * @return {EventEmitter}
 * @see Model.save
 */
Model.prototype.validate = function ( callback, attributes ){
  if ( typeof attributes == 'string' ) attributes = attributes.split(/\s*,\s*/);
  if ( !Array.isArray( attributes ) )  attributes = this._attributes;

  this._errors = {};

  var self     = this;
  var emitter  = new process.EventEmitter;

  var listener = this.app.tools.create_async_listener( attributes.length, function( result ){
    callback && callback( result.error || null, !self.has_errors() );

    if ( result.error )      emitter.emit( 'error',     result.error );
    if ( self.has_errors() ) emitter.emit( 'not_valid', self.get_errors() );
    else                     emitter.emit( 'success',   self );
  });

  attributes.forEach( function( attr ){
    this.validate_attribute( attr, listener.listen( 'error' ) );
  }, this );

  return emitter;
}


/**
 * Валидация отдельно взятого атрибута. Правила валидации описываются в методе {@link Model.attributes}
 *
 * @param {String} name имя валидируемого атрибута
 * @param {Function} callback функция которая вызывается после валидации атрибута
 * @param {Error} [callback.error] Системная ошибка возникшая во время валидации
 * @param {Error} [callback.not_valid] Ошибка валидации; если атрибут валиден, то null
 * @return {*}
 */
Model.prototype.validate_attribute = function( name, callback ){
  var rules   = this._[name].params.validation_rules;
  var errors  = this._[name].params.errors || {};

  for ( var rule in rules ) {
    if ( typeof this.app.validator[ rule ] != 'function' )
      return callback( new Error(
        '`{rule}` is undefined rule in description of attribute `{model}.{attr}`'.format({
          '{rule}'  : rule,
          '{model}' : this.class_name,
          '{attr}'  : name
        })
      ));

    var error = this.app.validator[ rule ](
      name,
      this.get_attribute( name, false ),
      rules[ rule ],
      errors[ rule ] );

    if ( error ) this._errors[ name ] = error;
  }

  callback( null, error || null );
};


/**
 * Метод показывает, есть ли ошибки валидации
 *
 * @return {Boolean}
 */
Model.prototype.has_errors = function () {
  return !!Object.keys( this._errors ).length;
}


/**
 * Возвращает ошибки валидации
 *
 * @return {Object} В виде {'название атрибута' : 'текст ошибки'}
 */
Model.prototype.get_errors = function(){
  return this._errors;
}


/**
 * Сравнение двух моделей. Две модели равны, только если они относятся к одному классу и имеют одинаковые значения
 * ключевых атрибутов. Модели, не имеющие ключевых атрибуто неравны
 *
 * @param {Model} model сравниваемая модель
 * @return {Boolean}
 * @see Model.get_id
 */
Model.prototype.equals = function ( model ) {
  if ( this.constructor != model.constructor ) return false;

  if ( !this._keys.length ) {
    this.log( 'Model `%s` does not have keys, so it can\'t be compared'.format( this.class_name ), 'warning' );
    return false;
  }

  for ( var i = 0, i_ln = this._keys.length; i < i_ln; i++ ) {
    var key = this._keys[i];
    if ( this[key] != model[key] ) return false;
  }

  return true;
};


/**
 * Возвращает идентификатор модели. Если у модели нет ключевых атрибутов - это null, если у модели один ключевой
 * атрибут - это его значение, иначе это объект ключи которого - названия ключевых атрибутов модели, а значения - это
 * значения этих атрибутов
 *
 * @return {*}
 */
Model.prototype.get_id = function(){
  switch ( this._keys.length ) {
    case 0:
      return null;

    case 1:
      return this[ this._keys[0] ];

    default:
      var result = {};
      this._keys.forEach( function( key ){
        result[ key ] = this[ key ];
      }, this );
      return result;
  }
};


//Model.prototype._check_for_cloning_description = function( description ){
//  for ( var rule in description ) {
//
//    var clone_from = null;
//    if ( rule == 'clone' ) clone_from = description[ rule ];   // { clone : 'user.email' }
//    if ( !clone_from )     clone_from = rule;                  // { 'user.email' : true }
//
//    var matches = /(\w+)\.(\w+)/.exec( clone_from );           // 1st pocket - model, 2 - attribute for clone
//    if ( !matches ) continue;
//
//    var model = this.models[ matches[1] ];
//    if ( !model ) {
//      this.log( 'Model `%s` for cloning attribute `%s` is not found'.format( matches[1], matches[2] ), 'warning' );
//      continue;
//    }
//
//    var cloned_description = model.get_attributes_description()[ matches[2] ];
//    if ( !cloned_description ) {
//      this.log( 'Description for attribute `%s` in model `%s` is not found'.format( matches[2], matches[1] ), 'warning' );
//      continue;
//    }
//
//    for ( var cloned_rule in cloned_description )
//      description[ cloned_rule ] = cloned_description[ cloned_rule ];
//
//    delete description[ rule ];
//    break;
//  }
//};
