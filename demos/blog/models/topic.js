module.exports = Topic.inherits( global.autodafe.db.ActiveRecord );

/**
 * Модель для топиков
 *
 * @param {Object} params
 * @extends ActiveRecord
 * @constructor
 */
function Topic( params ) {
  this._init( params );
}


/**
 * Переопределяем метод который привязывает экземпляры данного класса к определенной таблице в базе данных
 *
 * @return {String}
 */
Topic.prototype.get_table_name = function(){
  return 'topics';
}


/**
 * Здесь описываются атрибуты, присущие данной модели. Так как этот класс наследуется от ActiveRecord, то для него
 * автоматически создаются атрибуты одноименные с названием колонок в базе данных для таблицы привязанной к этому
 * классу. Так что здесь остается указать только дополнительные правила валидации
 *
 * @return {Object}
 */
Topic.prototype.attributes = function(){
  return {
    user_id : 'required',

    name : {
      'safe required'  : true,
      max_length       : 256   },

    description : {
      'safe required'  : true,
      max_length       : 4096   }
  };
}


/**
 * В этом методе указываются отношения между этой и другими моделями. Это необходимо для правильной генерации
 * сложных запросов к базе данных.
 *
 * @return {Object}
 */
Topic.prototype.relations = function () {
  return {
    // топик пренадлежит пользователю
    'author'   : this.belongs_to( 'user' ).by( 'user_id' ),

    // у топика есть много комментариев
    'comments' : this.has_many( 'comment' ).by( 'topic_id', {
      order : 'comments.date'
    })
  }
};
