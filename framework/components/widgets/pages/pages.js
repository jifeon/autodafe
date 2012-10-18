var path   = require('path');
var fs     = require('fs');

module.exports = Pages.inherits( global.autodafe.Widget );


/**
 * Виджет для вывода страниц
 *
 * Для создания виджета вместо использования конструктора пользуйтесь методом {@link Controller.create_widget}
 *
 * @constructor
 * @extends Widget
 * @param {Object} params см. {@link Pages._init}
 * @since 0.2.2
 * @example использование
 *
 * Конфигурационный файл, секция router.rules
 * <pre><code class="javascript">
 * rules : {
 *   '/some_path/<some_param:\\w+>/<page:\\d+>' : 'site.action',  // УРД вида /some_path/text/3
 *   '/some_path/<some_param:\\w+>'             : 'site.action',  // это правило будет использоваться, когда не будет
 *                                                                // указана страница
 * }
 * </code></pre>
 *
 * Так должно выглядить действие контроллера
 * <pre><code class="javascript">
 * SiteController.prototype.action = function( params, client ){
 *   var pages_widget = this.create_widget( 'pages', {
 *     items_per_page : 15,
 *     current_page   : params.page,     // виджет позаботится о типе параметра
 *     action_path    : 'site.action',
 *     url_params     : {
 *       some_param  : 'text'
 *     }
 *   } );
 *
 *   console.log( pages_widget.current_page ); // номер страницы начиная с нуля
 *
 *   //... какие-то действия
 *
 *   pages_widget.count = 53;  // мы можем задать общее количество сущностей когда угодно, его также можно было
 *                             // передать в параметрах при создании
 *
 *   this.send_response( 'some_view.html', client, {
 *     ...
 *     pages : pages_widget
 *   } );
 * }
 * </code></pre>
 *
 * параметры для create_widget описаны в {@link Pages._init}
 *
 * Во вью на месте где должен использоваться виджет необходимо разместить следующий код:
 * <pre><code class="javascript">
 * {#widget}pages{/widget}
 * </code></pre>
 */
function Pages( params ) {
  this._init( params );
}

/**
 * Инициализация виджета
 *
 * @private
 * @param {Object} params параметры для инициализации, см. также {@link Widget._init} Любой параметр для Pages
 * можно задать после его создания, если на момент создания он не известен.
 * @param {Number} [params.count=0] общее количество сущностей
 * @param {Number} [params.current_page=1] текущая страница (считается от единицы)
 * @param {Number} [params.items_per_page=10] количество сущностей на странице
 * @param {String} [params.view='links'] вид, в котором выведутся страницы "links" - просто ссылки, "ul" - ссылки
 * внутри списка, "table" - ссылки внутри таблицы
 * @param {String} [params.action_path=''] путь к действию контроллера, которое надо выполнять при переходе по ссылке
 * @param {Object} [params.url_params={}] параметры для создания ссылок через {@link Controller.create_url}, они будут
 * расширены параметром page - номер страницы, начиная от нуля
 * @param {Number} [params.links_aside=2] колиство ссылок выводящихся сбоку [1 2] .. 8 9 10 11 12 .. [18 19]
 * @param {Number} [params.links_around=2] количество ссылок окружающих текущую страницу 1 2 .. [8 9] 10 [11 12] .. 18 19
 */
Pages.prototype._init = function ( params ) {
  Pages.parent._init.call( this, params );

  /**
   * Название шаблона для dust
   *
   * @private
   * @type {String}
   */
  this._dust_id = 'pages_' + Math.random();

  /**
   * Количество всех сущностей
   * 
   * @type {Number}
   * @default 0
   */
  this.count = params.count || 0;

  /**
   * Текущая страница
   *
   * при задании проверяется на целое число
   *
   * @field
   * @name current_page
   * @type {Number}
   * @default 0
   * @namespace Pages.current_page
   */
  this._.current_page.set = function( value, descriptor ){
    descriptor.value = parseInt( value );
    if ( isNaN( descriptor.value ) ) descriptor.value = 0;
  }
  this.current_page   = params.current_page - 1;

  /**
   * Количество сущностей, выводимое на странице
   *
   * @type {Number}
   * @default 0
   */
  this.items_per_page = params.items_per_page || 10;

  /**
   * Общее количество страниц
   *
   * @field
   * @name pages_count
   * @namespace Pages.pages_count
   * @type {Number}
   */
  this._.pages_count.get = function(){
    if ( !this.items_per_page ) return 0;

    return Math.ceil( this.count / this.items_per_page );
  }

  /**
   * Вид, в котором выведутся страницы
   *
   * "links" - просто ссылки, "ul" - ссылки внутри списка, "table" - ссылки внутри таблицы
   *
   * @type {String}
   * @default "links"
   */
  this.view           = params.view || "links";

  /**
   * Путь к действию контроллера, которое надо выполнять при переходе по ссылке
   *
   * @type {String}
   * @default ""
   */
  this.action_path    = params.action_path || '';

  /**
   * Параметры для создания ссылок через {@link Controller.create_url}, они будут расширены параметром page - номер
   * страницы, начиная от нуля
   *
   * @type {Object}
   */
  this.url_params     = params.url_params || {};

  /**
   * Колиство ссылок выводящихся сбоку [1 2] .. 8 9 10 11 12 .. [18 19]
   *
   * @type {Number}
   * @default 2
   */
  this.links_aside    = params.links_aside  || 2;

  /**
   * Количество ссылок окружающих текущую страницу 1 2 .. [8 9] 10 [11 12] .. 18 19
   *
   * @type {Number}
   * @default 2
   */
  this.links_around   = params.links_around || 2;

  this._load_template();
};


/**
 * Загружает шаблоны для dust
 *
 * @private
 */
Pages.prototype._load_template = function () {
  var template  = fs.readFileSync( path.join( __dirname, 'lib','pages.html' ), 'utf8' );
  var page      = this.controller.dust.compile( template, this._dust_id );
  this.controller.dust.loadSource( page );
};


/**
 * Генерирует текст виджета
 *
 * см. {@link Widget.render}
 *
 * @param {Function} callback функция которая вызовется после того как текст виджета будет сгенерирован
 * @param {Error} callback.error ошибка которая может быть вызвана во время генерации
 * @param {String} callback.data текст виджета
 */
Pages.prototype.render = function( callback ){
  var pages = {}, i;
  var pages_count = this.pages_count;

  var left_limit  = Math.max( this.current_page - this.links_around, 0 );
  var right_limit = Math.min( this.current_page + this.links_around, pages_count - 1 );
  for ( i = left_limit; i <= right_limit; i++ ) pages[ i ] = true;

  var links_aside = Math.min( this.links_aside, Math.floor( this.pages_count / 2 ) );
  for ( i = 0; i < links_aside; i++ ) {
    pages[ i ]               = true;
    pages[ pages_count-i-1 ] = true;
  }

  var view_params  = {
    pages : Object.keys( pages ).map( this._make_link_object, this )
  }
  view_params[ this.view ] = true;

  this.controller.dust.render( this._dust_id, view_params, callback );
};


/**
 * Создает описание ссылки
 *
 * @private
 * @param value
 * @param i
 * @param ar
 */
Pages.prototype._make_link_object = function( value, i, ar ){
  var n = parseInt(value) + 1;
  this.url_params.page = n;

  return {
    number        : n,
    insert_space  : i != 0 && value - ar[ i - 1 ] != 1,
    active        : value == this.current_page,
    url           : this.controller.create_url( this.action_path, this.url_params )
  }
};