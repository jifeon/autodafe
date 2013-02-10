var DbCriteria        = global.autodafe.db.Criteria;
var Emitter           = process.EventEmitter;
var ActiveFinder      = require('./active_finder');
var _ = require('underscore');

var active_relations  = {
  belongs_to  : require('./relations/belongs_to_relation'),
  stat        : require('./relations/stat_relation'),
  has_one     : require('./relations/has_one_relation'),
  has_many    : require('./relations/has_many_relation'),
  many_many   : require('./relations/many_many_relation')
};

module.exports = ActiveRecord.inherits( autodafe.Model );


//todo: описать создание и использование

/**
 * Класс описывающий особый тип моделей, которые сохраняют информацию в базу данных
 *
 * @constructor
 * @extends Model
 */
function ActiveRecord() {
  throw new Error( 'ActiveRecord is abstract class. You can\'t instantiate it!' );
}


ActiveRecord._relations = null;


/**
 * Инициаизация ActiveRecord
 *
 * @private
 * @param {Object} params см. {@link Model._init}
 */
ActiveRecord.prototype._init = function( params ) {
  ActiveRecord.parent._init.call( this, params );

  /**
   * Признак того, что экземпляр привязан к нужной таблице и может использоваться
   *
   * @type {Boolean}
   */
  this._.is_inited      = false;

  this._.is_new         = params.is_new == undefined ? true : params.is_new;

  /**
   * Имя таблицы, к которой привязана запись
   *
   * @type {String}
   */
  this._.table_name     = null;
  this._.table_name.get = this.get_table_name.bind( this );

  if ( !this.table_name )
    throw new Error( 'You should specify `table_name` property for ' + this.class_name );

  /**
   * Соединение к базе данных, которую использует данная запись
   *
   * @type {DbConnection}
   */
  this._.db_connection  = this.app.db;
  if ( !this.db_connection )
    throw new Error(
      'Looks like you don\'t preload or config `db` component, but it\'s required for use ActiveRecord class `%s`'.format( this.class_name )
    );

  /**
   * Таблица, к которой привязана данная запись
   *
   * @type {DbTableSchema}
   */
  this._.table          = null;

  /**
   * Отношение данной записи к другим ActiveRecord
   *
   * @type {Object}
   */
  this._related         = [];
  this._alias           = 't';
  this._criteria        = null;
  this._relations       = {};

  this._bind_with_table();

  this.app.on( 'models_are_loaded', this._init_relations.bind(this) );

  var relations = this.relations();

  this.load = {};
  var self = this;
  for ( var relation_name in relations ) {
    Object.defineProperty( this.load, relation_name, {
      get : self.get_related.bind( self, relation_name, true )
    } );
  }
};


ActiveRecord.prototype._bind_with_table = function(){
  this.db_connection.db_schema.get_table( this.table_name, function( e, table ) {
    if ( e ) {
      e.message = 'Error while loading table `%s`. '.format( this.table_name ) + e.message;
      throw e;
    }

    this._.table      = table;
    this._.is_inited  = true;

    this.emit( 'ready' );
  }, this );
};


ActiveRecord.prototype._process_attributes = function( inited ){
  if ( !inited ) return this.on('ready', this._process_attributes.bind( this, true ));

  var self         = this;
  var descriptions = this.app.tools.to_object( this.attributes(), 1 );

  this.table.get_column_names().forEach( function( column_name ) {
    if ( !descriptions[ column_name ] ) {
      descriptions[ column_name ] = {};
      if ( self.table.get_column( column_name).is_primary_key ) descriptions[ column_name ].key = true;
    }
  }, this );

  for ( var attr in descriptions ) {
    this.create_attribute( attr, descriptions[attr] );
  }
};


ActiveRecord.prototype._after_init = function( params ){
  delete params.is_new;
  this.on('ready', ActiveRecord.parent._after_init.bind( this, params ));
}


/**
 * Возвращает имя таблицы, к которой привязана запись
 *
 * Необходимо переопределить в наследуемом классе. Для получение данного значения можно пользоваться геттером
 * {@link ActiveRecord.table_name}
 *
 * @returns {String} имя таблицы
 * @throws {Error} если не переопределить данный метод
 */
ActiveRecord.prototype.get_table_name = function () {
  throw new Error( 'You should implement method `get_table_name` for your class `%s`'.format( this.class_name ) );
};


/**
 * Инициализая отношений с другими ActiveRecord
 *
 * @private
 */
ActiveRecord.prototype._init_relations = function () {
  if ( this.get_relations() ) return;

  this.constructor._relations = {};
  var relations = this.relations();

  for ( var relation_name in relations ) {
    var params        = relations[ relation_name ];
    var relation_type = params.type;

    delete params.type;

    params.name  = relation_name;
    try {
      params.model = new this.app.models[ params.model ];
    }
    catch ( e ) {
      this.log(
        'Error while loading model `%s` as relation `%s` to %s'.format( params.model, relation_name, this.class_name ),
        'error'
      );
      throw e;
    }
    params.app   = this.app;

    this.constructor._relations[ relation_name ] = new active_relations[ relation_type ]( params );
  }

};


/**
 * Функция возвращающая отношение данного AR с другими
 *
 * Должна быть переопределена в наследуемых классах
 *
 * @returns {Object}
 */
ActiveRecord.prototype.relations = function () {
  return {};
};


/**
 * Возвращает глобальные отношения всех AR
 *
 * @returns {Object}
 */
ActiveRecord.prototype.get_relations = function () {
  return this.constructor._relations;
};


/**
 * Добавляет отношение
 *
 * @param {String} name название отношения
 * @param {ActiveRecord} record AR
 * @param {Boolean} index перечисляемое ли отношение добавляется
 */
ActiveRecord.prototype.add_related_record = function ( name, record, index ) {
  if (!~this._related.indexOf( name )) this._related.push( name );

  if ( !index ) this._[ name ] = this[ name ] || record;
  else {
    this._[ name ] = this[ name ] || [];
    if ( record instanceof ActiveRecord ) {
      if ( index === true ) this[ name ].push( record );
      else this[ name ][ index ] = record;
    }
  }
};


ActiveRecord.prototype.substitute_related_records = function ( callback ) {
  var self = this;
  this._related.forEach(function( name ){
    this._[name] = callback( this[ name ] );
  });
};


/**
 * Удаляет отношение
 *
 * @param {String} name имя отношения
 */
ActiveRecord.prototype.clean_related_records = function ( name ) {
  this._related.splice( this._related.indexOf( name ), 1 );
  delete this._[ name ];
};


/**
 * Возвращает отношение
 *
 * @param {String} name имя отношения
 * @param {Boolean} [refresh=false] надо ли очистить кэш
 * @param {Object} [params={}] параметры для запроса отношения
 * @example get_related
 * <pre><code class="javascript">
 * user.get_related( 'posts', true, { limit : 50 } );
 * </code></pre>
 */
ActiveRecord.prototype.get_related = function ( name, refresh, params ) {
  refresh = refresh || false;
  params  = params  || {};

  var relations = this.get_relations();

  if ( !relations[ name ] ) throw new Error(
    '%s does not have relation `%s`'.format( this.class_name, name )
  );

  if ( this[ name ] != null && !refresh && _.isEmpty( params ) )
    return this.app.tools.next_tick( this[ name ] );

  this.log( 'Load relation `%s`'.format( name ), 'trace' );

  var relation        = relations[ name ];
  if ( this.is_new && ( relation instanceof active_relations[ 'has_one' ] || relation instanceof active_relations[ 'has_many' ] ) )
    return this.app.tools.next_tick( relation instanceof active_relations[ 'has_one' ] ? null : [] );

  var saved_relation  = null;
  var With = {};
  if ( !_.isEmpty( params ) ) {
    saved_relation = this[ name ] == null ? null : this[ name ];
    With[ name ] = params;
  }
  else With = name;
  delete this._[ name ];

  var finder = new ActiveFinder({
    app   : this.app,
    model : this,
    With  : With
  });

  var emitter = new Emitter;
  var self    = this;

  finder.lazy_find( this, function( err ){
    if ( err ) return self.app.tools.next_tick( null, err, emitter );

    if( self[ name ] == null )
      self._[ name ] = relation instanceof active_relations[ 'has_many' ]
        ? []
        : relation instanceof active_relations[ 'stat' ]
          ? relation.defaultValue
          : null;

    var result = self[ name ];

    if ( !_.isEmpty( params ) )
      if( saved_relation != null ) self._[ name ] = saved_relation;
      else                  delete self._[ name ];

    self.app.tools.next_tick( result, null, emitter );
  } );

  return emitter;
};


ActiveRecord.prototype._create_relation = function ( type, model ) {
  var self = this;

  return {
    by : function( foreign_key, options ) {
      return {
        type        : type,
        foreign_key : foreign_key,
        options     : options || {},
        model       : model
      };
    }
  }
};


ActiveRecord.prototype.belongs_to = function ( model ) {
  return this._create_relation( 'belongs_to', model );
};


ActiveRecord.prototype.has_one = function ( model ) {
  return this._create_relation( 'has_one', model );
};


ActiveRecord.prototype.has_many = function ( model ) {
  return this._create_relation( 'has_many', model );
};


ActiveRecord.prototype.many_many = function ( model ) {
  return this._create_relation( 'many_many', model );
};


ActiveRecord.prototype.stat = function ( model ) {
  return this._create_relation( 'stat', model );
};


ActiveRecord.prototype.get_db_criteria = function ( create_if_null ) {
  if ( create_if_null == undefined ) create_if_null = true;

  if ( !this._criteria && create_if_null ) this._criteria = new DbCriteria;

  return this._criteria;
};


/**
 * Проверяет на идентичность модели.
 *
 * Две AR считаются одинаковыми, если они принадлежат одной таблице и имеют одинаковые значнения первичного ключа
 *
 * @param {Model} model модель с которой надо сравнить текущую
 */
ActiveRecord.prototype.equals = function ( model ) {
  var result = model instanceof ActiveRecord && this.table_name == model.table_name;
  if ( !result ) return false;

  if ( !this.table.primary_key ) return false;

  var self  = this;
  var pks   = Array.isArray( this.table.primary_key ) ? this.table.primary_key : [ this.table.primary_key ];
  return pks.every( function( pk ) {
    return self.get_attribute( pk ) == model[ pk ];
  } );
};


ActiveRecord.prototype.__execute_command = function ( command, emitter, option ) {
  emitter = emitter || new Emitter;

  command[ option == 'scalar' ? 'query_scalar' : 'execute' ]( function( e, result ) {
    emitter.emit( e ? 'error' : 'success', e || result );
  } );

  return emitter;
};


/**
 * Метод для подключения отношения в запрос
 *
 * Для корректной работы отношение должно быть определено в {@link ActiveRecord.relations}
 *
 * @returns {ActiveRecord} текущий AR
 * @example With
 * <pre><code class="javascript">
 * this.models.post.With( 'comments.author', 'comments_count' ).find_all().on( 'success', ... );
 * </code></pre>
 */
ActiveRecord.prototype.With = function () {
  var With = Array.prototype.slice.call( arguments, 0 );
  if ( Array.isArray( With[0] ) ) With = With[0];
  if ( With.length ) this.get_db_criteria().merge_with( {
    With : With
  } );

  return this;
};


/**
 * Возвращает построитель комманд
 *
 * @returns {CommandBuilder}
 */
ActiveRecord.prototype.get_command_builder = function () {
  return this.db_connection.db_schema.command_builder;
};


ActiveRecord.prototype.get_table_alias = function( quote ) {
  return quote ? this.db_connection.db_schema.quote_table_name( this._alias ) : this._alias;
}


ActiveRecord.prototype.set_table_alias = function ( alias ) {
  this._alias = alias;
};


/**
 * Возвращает значение первичного ключа
 *
 * @returns {mixed} Если ПК несколько, то вернется массив, если их нет - то null
 */
ActiveRecord.prototype.get_primary_key = function () {

  var result = [];

  this.table.each_primary_key( function( pk ) {
    result.push( this.get_attribute( pk ) );
  }, this );

  return result.length > 1 ? result : result[0] || null;
};


/**
 * Задает ПК
 *
 * @param primary_key первичный ключ, если их несколько, то надо передать объект вида { pk1 : value, ... }
 */
ActiveRecord.prototype.set_primary_key = function( primary_key ) {
  if ( Array.isArray( this.table.primary_key ) )
    this.table.each_primary_key( function( key ) {
      this.set_attribute( key, primary_key[ key ] );
    }, this );

  else this.set_attribute( this.table.primary_key, primary_key );
}


/**
 * Сохраняет AR
 *
 * Для новой записи будет выполнен {@link ActiveRecord.insert}, для существующей {@link ActiveRecord.update}
 *
 * @param {Function} [callback] функция, которая будет выполнена после сохранения
 * @param {String[]} [attributes] массив названий сохраняемых атрибутов
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error ), validation_error( String[] )
 * @example save new record
 * <pre><code class="javascript">
 * var post = new this.models.post;
 * post.title = "Name";
 * post.content = "Description";
 * post.save()
 *   .on( 'error', function(e){} )
 *   .on( 'not_valid', function( errors ){} )
 *   .on( 'success', function( result ){
 *     console.log( post.id == result.insert_id ); // primary key будет присвоен автоматически после сохранения
 *   } );
 * </code></pre>
 * save exist record
 * <pre><code class="javascript">
 * this.models.post.find_by_pk(2)
 *   .on( 'error', ... )
 *   .on( 'success', function( post ){
 *     if ( !post ) return; // post not found
 *
 *     post.title = 'changed';
 *     post.save( [ 'title' ] ); // можно указать сохраняемые атрибуты, иначе в запрос попадут все остальные даже
 *                               // неизмененные атрибуты
 *   } )
 * </code></pre>
 */
ActiveRecord.prototype.forced_save = function( callback, attributes ) {
  return this.is_new ? this.insert( attributes ) : this.update( attributes );
}


/**
 * Сохраняет новую AR в базу
 *
 * @param {String[]} [attributes] названия атрибутов, которые надо сохранить
 * @param {Boolean} [ignore=false] добавляет IGNORE в sql запрос, что позволяет замалчивать ошибки сохранения записей с
 * одинаковыми уникальнымиполями
 * @throws {Error} при попытке сохранения существующей записи
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 */
ActiveRecord.prototype.insert = function( attributes, ignore ) {
  this.log( 'insert' );

  if ( !this.is_new )
    throw new Error( 'The active record cannot be inserted to database because it is not new.' );

  var self    = this;
  var emitter = new Emitter;
  var builder = this.get_command_builder();
  var command = builder.create_insert_command( this.table, this.get_attributes( attributes ), ignore );

  command.execute( function( e, result ) {
    if ( e ) return emitter.emit( 'error', e );

    if ( self.table.in_sequence ) self.table.each_primary_key( function( pk ) {

      if ( self[ pk ] == null ) {
        self[ pk ] = result.insert_id;
        return false;
      }
    } );

    self._.is_new = false;

    emitter.emit( 'success', result );
  });

  return emitter;
}


/**
 * Сохраняет существующую AR в базу
 *
 * @param {String[]} [attributes] названия атрибутов, которые надо сохранить
 * @throws {Error} при попытке сохранения новой записи
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 */
ActiveRecord.prototype.update = function( attributes ) {
  this.log( 'update' );

  if ( this.is_new )
    throw new Error( 'The active record cannot be updated because it is new.' );

  return this.update_by_pk( this.get_primary_key(), this.get_attributes( attributes ) );
}


/**
 * Удаление AR из базы
 *
 * @throws {Error} при попытке удалить новую AR
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 */
ActiveRecord.prototype.remove = function() {
  this.log( 'remove' );

  if ( this.is_new ) throw new Error( 'The active record cannot be deleted because it is new.' );

  return this.remove_by_pk( this.get_primary_key() )
}


/**
 * Обновление существующей AR
 *
 * @throws {Error} при попытке обновить новую AR
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 */
ActiveRecord.prototype.refresh = function() {
  this.log( 'refresh' );

  if ( this.is_new ) throw new Error( 'The active record cannot be refreshed because it is new.' );

  var emitter = new Emitter;
  var self = this;

  this.find_by_pk( this.get_primary_key() )
    .on( 'error', function( e ) {
      emitter.emit( 'error', e );
    } )
    .on( 'success', function( record ) {
      if ( !record ) return emitter.emit( 'error', new Error( 'Can\'t find reflection of record in data base' ) );

      self.clean_attributes();
      self.table.get_column_names().forEach( function( name ) {
        self.set_attribute( name, record[ name ], false );
        self._[name].params.disable_postfilters = true;
      } );

      emitter.emit( 'success' );
    } );

  return emitter;
}


ActiveRecord.prototype.apply_scopes = function ( criteria ) {
  var c = this.get_db_criteria( false );
  if ( c ) {
    c.merge_with( criteria );
    criteria = c;
    this._criteria = null;
  }

  return criteria;
};


ActiveRecord.prototype.query = function ( criteria, all ) {
  all = all || false;

  criteria    = this.apply_scopes( criteria );
  var emitter = new Emitter;

  if ( _.isEmpty( criteria.With ) ) {
    if( !all ) criteria.limit = 1;

    var command = this.get_command_builder().create_find_command( this.table, criteria );
    var self    = this;

    command.execute( function( e, result ) {
      if ( e ) return emitter.emit( 'error', e );

      var res = [];

      result.fetch_obj( function( obj ) {
        res.push( self.populate_record( obj ) );

        if ( !all ) return false;
      } );

      emitter.emit( 'success', all ? res : res[0] || null );
    } );
  }

  else {

    var finder = new ActiveFinder({
      app   : this.app,
      model : this,
      With  : criteria.With
    });

    finder.query( criteria, all, function( err, result ) {
      if ( err ) emitter.emit( 'error', err );
      else emitter.emit( 'success', result );
    } );
  }

  return emitter;
};


ActiveRecord.prototype.populate_record = function( attributes ) {
  if ( !attributes ) return null;

  var record = new this.constructor({
    app    : this.app,
    is_new : false
  });

  for ( var name in attributes ) {
    record.set_attribute( name, attributes[ name ], false );
    record._[name].params.disable_postfilters = true;
  }

  return record;
};


/**
 * Поиск одной AR
 *
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}
 * @returns {events.EventEmitter} success( {@link ActiveRecord} ), error( Error )
 * @example find
 * <pre><code class="javascript">
 * this.models.post.find(); // первая попавшаяся
 * this.models.post.find( 'id=:id', { id : 5 } );
 * this.models.post.find( 'text=:text OR id=8', {text : "Текст будет экранирован"} );
 * this.models.post.find( {
 *   condition : "text=:text and some_table.some_value = 5",
 *   params    : { text : 'some text' },
 *   order     : 'date',
 *   join      : 'INNER JOIN some_table'
 * } )
 * </code></pre>
 */
ActiveRecord.prototype.find = function ( condition, params ) {
  this.log( 'find' );

  var criteria = this.get_command_builder().create_criteria( condition, params );

  return this.query( criteria );
};


/**
 * Ищет все записи подходящие по условиям
 *
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link ActiveRecord}[] ), error( Error )
 */
ActiveRecord.prototype.find_all = function( condition, params ) {
  this.log( 'find_all' );

  var criteria = this.get_command_builder().create_criteria( condition, params );

  return this.query( criteria, true );
};


/**
 * Ищет AR по первичному ключу
 *
 * @param {Array|mixed} pk первичный ключ
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link ActiveRecord} ), error( Error )
 * @example find_by_pk
 * <pre><code class="javascript">
 * this.models.post.find_by_pk(2);
 * </code></pre>
 */
ActiveRecord.prototype.find_by_pk = function( pk, condition, params ) {
  this.log( 'find_by_pk' );

  var prefix    = this.get_table_alias() + '.';
  var criteria  = this.get_command_builder().create_pk_criteria( this.table, pk, condition, params, prefix );

  return this.query( criteria );
};


/**
 * Ищет несколько AR по первичному ключу
 *
 * @param {Array} pk массив первичных ключей
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link ActiveRecord}[] ), error( Error )
 * @example find_all_by_pk
 * <pre><code class="javascript">
 * this.models.post.find_all_by_pk( [2, 3] );
 *
 * //для таблиц с множественным ПК
 * this.models.category.find_all_by_pk( [ { key1 : 2, key2 : 1 }, { key1 : 1, key2 : 3 } ] );
 * </code></pre>
 */
ActiveRecord.prototype.find_all_by_pk = function( pk, condition, params ) {
  this.log( 'find_all_by_pk' );

  var prefix    = this.get_table_alias() + '.';
  var criteria  = this.get_command_builder().create_pk_criteria( this.table, pk, condition, params, prefix );

  return this.query( criteria, true );
}


/**
 * Поиск AR по атрибутам
 *
 * @param {Object} attributes атрибуты по которым ищем
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link ActiveRecord} ), error( Error )
 * @example find_by_attributes
 * <pre><code class="javascript">
 * this.models.post.find_by_attributes( { user_id : 4, type : 'topic' } );
 * </code></pre>
 */
ActiveRecord.prototype.find_by_attributes = function( attributes, condition, params ) {
  this.log( 'find_by_attributes' );

  var prefix    = this.get_table_alias() + '.';
  var criteria  = this.get_command_builder().create_column_criteria( this.table, attributes, condition, params, prefix );

  return this.query( criteria );
}


/**
 * Поиск нескольких AR по атрибутам
 *
 * @param {Object} attributes атрибуты по которым ищем
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link ActiveRecord}[] ), error( Error )
 * @example find_all_by_attributes
 * <pre><code class="javascript">
 * this.models.post.find_all_by_attributes( { user_id : 4, type : 'topic' } );
 * </code></pre>
 */
ActiveRecord.prototype.find_all_by_attributes = function( attributes, condition, params ) {
  this.log( 'find_all_by_attributes' );

  var prefix    = this.get_table_alias() + '.';
  var criteria  = this.get_command_builder().create_column_criteria( this.table, attributes, condition, params, prefix );

  return this.query( criteria, true );
}


/**
 * Поиск AR по sql
 *
 * @param {String} sql sql запрос
 * @param {Object} [params={}] параметры к sql запросу
 * @returns {events.EventEmitter} success( {@link ActiveRecord} ), error( Error )
 * @example find_by_sql
 * <pre><code class="javascript">
 * this.models.post.find_by_sql( 'select title from `posts` where text=:text', { text : 'some text' } );
 * </code></pre>
 */
ActiveRecord.prototype.find_by_sql = function( sql, params ) {
  this.log( 'find_by_sql' );

  var command = this.get_command_builder().create_sql_command( sql, params );
  var emitter = new process.EventEmitter;
  var self = this;

  command.execute( function( e, result ) {
    if ( e ) return emitter.emit( 'error', e );

    var record;
    result.fetch_obj( function( obj ) {
      record = self.populate_record( obj );
      return false;
    } );

    emitter.emit( 'success', record );
  } );

  return emitter;
}


/**
 * Поиск нескольких AR по sql
 *
 * @param {String} sql sql запрос
 * @param {Object} [params={}] параметры к sql запросу
 * @returns {events.EventEmitter} success( {@link ActiveRecord}[] ), error( Error )
 * @example find_all_by_sql
 * <pre><code class="javascript">
 * this.models.post.find_all_by_sql( 'select title from `posts` where text=:text', { text : 'some text' } );
 * </code></pre>
 */
ActiveRecord.prototype.find_all_by_sql = function( sql, params ) {
  this.log( 'find_all_by_sql' );

  var command = this.get_command_builder().create_sql_command( sql, params );
  var emitter = new process.EventEmitter;
  var self = this;

  command.execute( function( e, result ) {
    if ( e ) return emitter.emit( 'error', e );
    
    var records = [];
    result.fetch_obj( function( obj ) {
      records.push( self.populate_record( obj ) );
    }  );

    emitter.emit( 'success', records );
  } );
  return emitter;
}


/**
 * Выяснение количества AR
 *
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( Number ), error( Error )
 * @example count
 * <pre><code class="javascript">
 * this.models.post.count().on( 'success', function( count ){ ... } );
 * </code></pre>
 */
ActiveRecord.prototype.count = function( condition, params ) {
  this.log( 'count' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_count_command( this.table, criteria );

  return this.__execute_command( command, null, 'scalar' );
}


/**
 * Выяснение количества AR найденных по определенному sql запросу
 *
 * @param {String} sql sql запрос
 * @param {Object} [params={}] параметры к sql запросу
 * @returns {events.EventEmitter} success( Number ), error( Error )
 */
ActiveRecord.prototype.count_by_sql = function( sql, params ) {
  this.log( 'count_by_sql' );

  var builder = this.get_command_builder();
  var command =  builder.create_sql_command( sql, params );

  return this.__execute_command( command, null, 'scalar' );
}

/**
 * Выяснение количества AR соответствующих указанным атрибутам
 *
 * @param {Object} attributes атрибуты по которым ищем
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( Number ), error( Error )
 */
ActiveRecord.prototype.count_by_attributes = function ( attributes, condition, params ) {
  this.log( 'count_by_attributes' );

  var builder   = this.get_command_builder();
  var prefix    = this.get_table_alias() + '.';
  var criteria  = builder.create_column_criteria( this.table, attributes, condition, params, prefix );
  var command   = builder.create_count_command( this.table, criteria );

  return this.__execute_command( command, null, 'scalar' );
};


/**
 * Выяснение существования AR
 *
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( Boolean ), error( Error )
 */
ActiveRecord.prototype.exists = function( condition, params ) {
  this.log( 'exists' );

  var criteria    = this.get_command_builder().create_criteria( condition, params );
  criteria.select = '*';
  criteria.limit  = 1;

  var command     = this.get_command_builder().create_find_command( this.table, criteria );
  var self        = this;
  var emitter     = new Emitter;

  command.execute( function( e, result ) {
    if ( e ) return emitter.emit( 'error', e );

    emitter.emit( 'success', !!result.get_num_rows() );
  } );

  return emitter;
}


/**
 * Обновление AR по первичному ключу
 *
 * @param {mixed} pk первичный ключ
 * @param {Object} attributes атрибуты которые будут обновлены
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 * @example update_by_pk
 * <pre><code class="javascript">
 * this.models.post.update_by_pk( 2, { text : 'new text' } )
 * </code></pre>
 */
ActiveRecord.prototype.update_by_pk = function( pk, attributes, condition, params ) {
  this.log( 'update_by_pk' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_pk_criteria( this.table, pk, condition, params );
  var command   = builder.create_update_command( this.table, attributes, criteria );

  return this.__execute_command( command );
}


/**
 * Обновление всех подходящих AR
 *
 * @param {Object} attributes атрибуты которые будут обновлены
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 * @example update_all
 * <pre><code class="javascript">
 * this.models.post.update_all( { text : 'new text' }, 'user_id=5' )
 * </code></pre>
 */
ActiveRecord.prototype.update_all = function( attributes, condition, params ) {
  this.log( 'update_all' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_update_command( this.table, attributes, criteria );

  return this.__execute_command( command );
}


/**
 * Увеличение и уменьшение числовых полей
 *
 * @param {Object} counters поля которые надо изменить
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @returns {events.EventEmitter} success( {@link MysqlResult} ), error( Error )
 * @example update_counters
 * <pre><code class="javascript">
 * // прибавит пользователю с id=5 количетво визитов на 1, и отнимет рейтинг на 15
 * this.models.user.update_counters( { visits : +1, rating : -15 }, 'id=5' )
 * </code></pre>
 */
ActiveRecord.prototype.update_counters = function( counters, condition, params ) {
  this.log( 'update_counters' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_update_counter_command( this.table, counters, criteria );

  return this.__execute_command( command );
}


ActiveRecord.prototype.update_all_by_sql = function( sql, params ) {
  this.log( 'update_all_by_sql' );

  var builder = this.get_command_builder();
  var command = builder.create_sql_command( sql, params );

  return this.__execute_command( command );
}


/**
 * Удаление по первичному ключу
 *
 * @param {mixed} pk первичный ключ
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 */
ActiveRecord.prototype.remove_by_pk = function( pk, condition, params ) {
  this.log( 'remove_by_pk' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_pk_criteria( this.table, pk, condition, params );
  var command   = builder.create_delete_command( this.table, criteria );

  return this.__execute_command( command );
}


/**
 * Удалит все подходящие AR
 *
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 */
ActiveRecord.prototype.remove_all = function( condition, params ) {
  this.log( 'remove_all' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_criteria( condition, params );
  var command   = builder.create_delete_command( this.table, criteria );

  return this.__execute_command( command );
}


/**
 * Удалит все подходящие по атрибутам AR
 *
 * @param {Object} attributes атрибуты по которым будет производится поиск
 * @param {DbCriteria|Object|String} [condition=''] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 * @param {Object} [params={}] см. {@link CommandBuilder.create_criteria}, примеры {@link ActiveRecord.find}
 */
ActiveRecord.prototype.remove_all_by_attributes = function( attributes, condition, params ) {
  this.log( 'remove_all_by_attributes' );

  var builder   = this.get_command_builder();
  var criteria  = builder.create_column_criteria( this.table, attributes, condition, params );
  var command   = builder.create_delete_command( this.table, criteria );

  return this.__execute_command( command );
}
