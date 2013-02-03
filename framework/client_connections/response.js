var path  = require('path');
var _     = require('underscore');

module.exports = Response.inherits( global.autodafe.AppModule );


/**
 * Класс описывающий ответ клиенту
 *
 * Создается автоматически при получении запроса. По умолчанию настроен, чтобы отправить представление с темже
 * названием, что и действие в которое направлен запрос, по тому же протоколу, что подключен клиент инициализировавший
 * запрос.
 *
 * Класс имеет удобные методы для выбора представления, отсылаемого пользователю, и передачи ему параметров, как
 * синхронно, так и асинхронно. Для создания экземпляра, пользуйтесь методом {@link Controller.create_response}
 *
 * @param {Object} params
 * @param {Controller} params.controller Контроллер, действие которого инициализировал запрос
 * @param {Request} params.request Запрос, получение которого привило к созданию ответа
 * @param {String} params.view Имя представления
 * @constructor
 * @extends AppModule
 */
function Response( params ) {
  this._init( params );
}


/**
 * @event
 * @name sent
 * @description Ответ отослан
 */


/**
 * Инициализация
 *
 * @param params см. конструктор {@link Response}
 * @private
 */
Response.prototype._init = function( params ) {
  Response.parent._init.call( this, params );

  /**
   * Контроллер, создавший ответ
   *
   * @type {Controller}
   */
  this.controller     = params.controller;

  /**
   * Параметры для представления
   *
   * Для задания пользуйтесь методом {@link Response.merge_params} или {@link Response.send}
   *
   * @type {Object}
   */
  this.params         = {
    cd : this.controller.views_folder
  };

  if ( !params.request ) this.log(
    '`request` is undefined in Response constructor. An error will be thrown if you try send this response',
    'warning' );

  /**
   * Запрос, получение которого привило к созданию ответа
   *
   * @type {Request}
   */
  this.request        = params.request;

  /**
   * Путь к представлению, которое будет отправлено в ответе
   *
   * @type {String}
   * @private
   * @see Response.view_name
   * @see Response.view_extension
   * @see Response.view_file_name
   * @see Response.view_path
   */
  this._path_to_view  = path.join( this.controller.views_path, params.view + this.controller.views_ext );

  /**
   * Listener для асинхронных параметров
   *
   * @type {ListenerForResponse}
   * @private
   */
  this._listener      = null;

  /**
   * Именя асинхронных параметров
   *
   * @type {Array}
   * @private
   */
  this._params_names  = [];

  /**
   * Признак того, что глобальные параметры для представления из контроллера слиты с параметрами {@link Response}
   *
   * Параметры сливаются с глобальными только при первом {@link Response.merge_params}, потому что в этот момент
   * становится понятно, что будет вызван {@link Response.send}
   *
   * @type {Boolean}
   * @private
   */
  this._global_params_merged = false;

  /**
   * Признак того, что данный ответ отослан
   *
   * Ответ не можен быть отослан более одного раза
   *
   * @type {Boolean}
   * @private
   */
  this._sent          = false;

  this._init_listener();
};


/**
 * Инициализация {@link Response._listener}
 *
 * @private
 */
Response.prototype._init_listener = function(){
  this._listener = new global.autodafe.cc.Listener({
    app       : this.app,
    response  : this
  });

  this._listener.success( this._try_send.bind( this ) );

  for ( var action in this.controller.behaviors ){
    var behavior = this.controller.behaviors[ action ];
    this._listener.behavior_for(action, behavior.bind( this.controller, this, this.request ));
  }
}


/**
 * Метод для задания и получения имени представления, привязанного к данному ответу
 *
 * @param {String} [name]
 * @return {String|Response} this, если используется как сеттер
 */
Response.prototype.view_name = function( name ){
  if ( !name ) return path.basename( this._path_to_view, path.extname( this._path_to_view ));

  this._path_to_view = path.join( path.dirname( this._path_to_view ), name + this.view_extension());
  return this;
}


/**
 * Метод для задания и получения расширения представления, привязанного к данному ответу
 *
 * @param {String} [ext]
 * @return {String|Response} this, если используется как сеттер
 */
Response.prototype.view_extension = function( ext ){
  if ( !ext ) return path.extname( this._path_to_view );

  if ( ext.charAt(0) != '.' ) ext = '.' + ext;
  this._path_to_view = path.join( path.dirname( this._path_to_view ), this.view_name() + ext);
  return this;
}


/**
 * Метод для задания и получения полного имени представления с расширением
 *
 * @param {String} [name]
 * @return {String|Response} this, если используется как сеттер
 */
Response.prototype.view_file_name = function( name ){
  if ( !name ) return this.view_name() + this.view_extension();

  this._path_to_view = path.join( path.dirname( this._path_to_view ), name);
  return this;
}


/**
 * Метод для задания и получения пути до представления, привязанного к данному ответу
 *
 * Путь может быть как абсолютным, так и относительным от директории {@link Application.path_to_views}
 *
 * @param {String} [p] путь
 * @return {String|Response} this, если используется как сеттер
 */
Response.prototype.view_path = function( p ){
  if ( !p ) return this._path_to_view;

  this._path_to_view = path.resolve( this.app.path_to_views, p );
  return this;
}


/**
 * Создает новый инструмент для работы с асинхронным кодом
 *
 * @return {ListenerForResponse}
 */
Response.prototype.create_listener = function(){
  return new global.autodafe.cc.Listener({
    app       : this.app,
    response  : this,
    behaviors : this._listener.behaviors
  });
}


/**
 * Обработка ошибок
 *
 * По умолчанию ошибка перенаправляется в {@link Response.controller} Метод можно переопределять в наследуемых классах
 *
 * @param {Error} e
 */
Response.prototype.handle_error = function( e ){
  this.controller.handle_error(e, this, this.request);
}


/**
 * Задает поведение для любых действий эмиттеров, кроме error и success
 *
 * @param {String} action действие
 * @param {Function} cb функция обработчик
 */
Response.prototype.behavior_for = function( action, cb ){
  this._listener.behavior_for( action, cb );
}


/**
 * Запускает механизм отправки представления
 *
 * @param {Object} [params] параметры для отправляемого представления
 * @return {Response} this
 */
Response.prototype.send = function( params/*, error_number*/ ){
  if ( this._sent ) return this;
  this._sent = true;

  if ( params instanceof Error ) {
    var client = this.request.client;
    return client.send_error.apply( client, arguments );
  }
  this.merge_params( params );

  if ( !this._params_names.length ) this.forced_send();
  return this;
};


/**
 * Попытка реальной отправки представления после получения всех асинхронных параметров
 *
 * @private
 */
Response.prototype._try_send = function(){
  for ( var i = 0, i_ln = arguments.length; i<i_ln; i++ )
    this.params[ this._params_names[i] ] = arguments[i];

  this._params_names = [];

  if ( this._sent ) this.forced_send();
}


/**
 * Отправляет представление клиенту
 *
 * @return {Response} this
 */
Response.prototype.forced_send = function(){
  var self      = this;
  var view_name = path.relative( this.app.path_to_views, this.view_path() );

  this.controller.render( view_name, this.params, function( e, data ){
    if ( e ) return self.request.client.send_error( e );

    self.request.client.send( data );
    self.emit('sent');
  });

  return this;
}


/**
 * Добавляет параметры для представления
 *
 * Если параметры являются эмиттерами, они будут отправлен после того как эмиттеры будут выполнены (success)
 *
 * @param {Object} params
 * @return {Response} this
 */
Response.prototype.merge_params = function( params ){
  if ( !this._global_params_merged ) {
    this._global_params_merged = true;

    this.params = _.defaults(this.controller.views_functions, this.params);
    this.params.response = this;
    this.merge_params( this.controller.global_view_params( this, this.request ));
  }

  var EE = process.EventEmitter;

  for ( var name in params ) {
    var value = params[ name ];
    if ( value && value.constructor == EE ) {
      this._listener.handle_emitter( value );
      this._params_names.push( name );
    }

    this.params[ name ] = value;
  }

  return this;
};


/**
 * Создает специальный колбэк для асинхронных функций
 *
 * Результат кодбэка автоматически добавится в параметры для представления. Первым параметром колбэка должна быть
 * ошибка или null, вторым - результат выполнения
 *
 * @param {String} name название параметра для представления, для которого создается колбэк
 * @return {Function}
 */
Response.prototype.callback_for = function( name ){
  this._params_names.push( name );
  return this._listener.get_callback();
}