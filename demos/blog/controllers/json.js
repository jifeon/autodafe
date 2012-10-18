module.exports = Json.inherits( global.autodafe.Controller );

/**
 * Базовый класс для контроллеров, которые отправляют json в виде ответа
 *
 * @param params
 * @extends Controller
 * @constructor
 */
function Json( params ){
  this._init( params );
}


Json.prototype._init = function( params ){
  Json.parent._init.call( this, params );

  // все представления для наследуемых классов будут искаться в директории views/json
  this.views_folder = 'json';

  // расширение представлений по умолчанию будет .json вместо .html
  this.views_ext    = '.json';

  // если во время сохранения моделей, произойдет ошибка валидации, она будет обработана в методе Json.validation_error
  this.behavior_for( 'not_valid', this.validation_error );
}


/**
 * Метод для обработки ошибок валидации
 *
 * @param {Response} response
 * @param {Request} request
 * @param {Object} errors
 */
Json.prototype.validation_error = function( response, request, errors ){

  // метод отправляет представление заранее указанное для response с параметром errors, в который попадуют ошибки
  // валидации. На клиенте они разбираются и показываются в нужных участках формы
  response.send({
    errors : errors
  });
}