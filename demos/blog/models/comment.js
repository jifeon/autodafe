module.exports = Comment.inherits( global.autodafe.db.ActiveRecord );

/**
 * Модель для комментариев к топикам
 *
 * @param {Object} params
 * @extends ActiveRecord
 * @constructor
 */
function Comment( params ) {
  this._init( params );
}


/**
 * Переопределяем метод который привязывает экземпляры данного класса к определенной таблице в базе данных
 *
 * @return {String}
 */
Comment.prototype.get_table_name = function () {
  return 'comments';
};


/**
 * Здесь описываются атрибуты, присущие данной модели. Так как этот класс наследуется от ActiveRecord, то для него
 * автоматически создаются атрибуты одноименные с названием колонок в базе данных для таблицы привязанной к этому
 * классу. Так что здесь остается указать только дополнительные правила валидации
 *
 * @return {Object}
 */
Comment.prototype.attributes = function(){
  return {
    'user_id'  : 'required',
    'topic_id' : 'required',
    'text'     : {
     'safe required'  : true,
      max_length      : 1024,
      prefilters      : 'trim' }
  };
}


/**
 * В этом методе указываются отношения между этой и другими моделями. Это необходимо для правильной генерации
 * сложных запросов к базе данных.
 *
 * @return {Object}
 */
Comment.prototype.relations = function () {
  return {
    // комментарий принадлежит пользователю, поле user_id в таблице comments служит для определения какому инменно
    // пользователю принадлежит комментарий
    'commenter'  : this.belongs_to( 'user' ).by( 'user_id' )
  }
};