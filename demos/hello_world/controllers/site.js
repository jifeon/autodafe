// наследуем наш контроллер от Controller
module.exports = Site.inherits( global.autodafe.Controller );

/**
 * Единственный в данном приложении контроллер, который и отвечает за логику работы приложения
 *
 * @constructor
 * @extends Controller
 * @param {Object} params
 */
function Site( params ) {
  this._init( params );
}


/**
 * Главная страница сайта. Этот метод указан в секции router.rules конфигурационного файла для корня сайта
 *
 * @param {Response} response ответ клиенту сделавшему запрос
 * @param {Request} request сам запрос
 */
Site.prototype.index = function ( response, request ) {
  // метод response.send сам найдет представлением с таким же именем как и название действия - index.html
  response.send({
    name : this.app.params.your_name
  });
};