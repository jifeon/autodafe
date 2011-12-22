module.exports = SiteController.inherits( autodafe.Controller ); // наследуем от Controller

/**
 * Единственный в данном приложении контроллер, который и отвечает за логику работы приложения
 *
 * @constructor
 * @extends Controller
 * @param {Object} params
 */
function SiteController( params ) {
  this._init( params );
}


/**
 * Главная страница сайта. Этот метод указан в секции router.rules конфигурационного файла для корня сайта
 *
 * @param {Object} params параметры пришедшие с запросом
 * @param {Client} client клиент совершающий действие
 */
SiteController.prototype.index = function ( params, client ) {
  this.send_response( 'index.html', client, {
    name : this.app.get_param( 'your_name' )
  } );
};