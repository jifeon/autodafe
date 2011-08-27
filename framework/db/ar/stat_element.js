var app_module = require('app_module');

module.exports = StatElement.inherits( app_module );

function StatElement( params ) {
  this._init( params );
}


StatElement.prototype._init = function( params ) {
  this.super_._init( params );

  var ActiveFinder = require( './active_finder' );
  if ( !ActiveFinder.is_instantiate( params.finder ) ) throw new Error(
    '`finder` is required and should be instance of ActiveFinder in StatRelation.init'
  );
  this._finder          = params.finder;

  var JoinElement = require( './join_element' );
  if ( !JoinElement.is_instantiate( params.parent ) ) throw new Error(
    '`parent` is required and should be instance of StatRelation in StatElement.init'
  );
  this._parent          = params.parent;
  this._parent.stats.push( this );

  var StatRelation = require( './relations/stat_relation' );
  if ( !StatRelation.is_instantiate( params.relation ) ) throw new Error(
    '`relation` is required and should be instance of StatRelation in StatElement.init'
  );
  this.relation          = params.relation;
};


StatElement.prototype.query = function( callback ) {
  var matches = /^\s*(.*?)\((.*)\)\s*/.exec( this.relation.foreign_key );

  try {
    if( matches )
      this._query_many_many( matches[1], matches[2] );
    else
      this._query_one_many( callback );
  } catch (e){
    callback(e);
  }
}



StatElement.prototype._query_one_many = function( callback ) {
  var relation  = this.relation;
  var model     = relation.model;
  var builder   = model.get_command_builder();
  var schema    = builder.db_schema;
  var table     = model.table;
  var parent    = this._parent;
  var pk_table  = parent.model.table;

  var fks = relation.foreign_key.trim().split( /\s*,\s*/ );
  if ( fks.length != pk_table.get_number_of_pks() ) throw new Error(
    'The relation `{relation}` in active record class `{class}` is specified with an invalid foreign key.\
     The columns in the key must match the primary keys of the table `{table}`.'.format({
      '{relation}'  : relation.name,
      '{class}'     : parent.model.class_name,
      '{table}'     : pk_table.name
    })
  );

  // set up mapping between fk and pk columns
  var map = {};  // { pk : fk, ... }
  fks.forEach( function( fk, i ){
    if ( !table.get_column( fk )) throw new Error(
      'The relation `{relation}` in active record class `{class}` is specified with an invalid foreign key `{key}`.\
       There is no such column in the table `{table}`.'.format({
        '{relation}'  : relation.name,
        '{class}'     : parent.model.class_name,
        '{table}'     : pk_table.name,
        '{key}'       : fk
      })
    );

    if( table.foreign_keys[fk] ) {
      var table_name = table.foreign_keys[fk][0];
      var pk         = table.foreign_keys[fk][1];

      if( schema.compare_table_names( pk_table.raw_name, table_name ) )
        map[ pk ] = fk;
      else throw new Error(
        'The relation `{relation}` in active record class `{class}` is specified with a foreign key `{key}` \
         that does not point to the parent table `{table}`.'.format({
          '{relation}'  : relation.name,
          '{class}'     : parent.model.class_name,
          '{table}'     : pk_table.name,
          '{key}'       : fk
        })
      );
    }

    else  // fk constraints undefined
      if( Array.isArray( pk_table.primary_key )) // composite pk
        map[ pk_table.primary_key[ i ]] = fk;
      else
        map[ pk_table.primary_key ] = fk;
  });

//  var records = this._parent.records;

  var where   = !relation.condition ? ' WHERE ' : ' WHERE (' + relation.condition + ') AND ';
  var group   = !relation.group     ? ''        : ', ' + relation.group;
  var having  = !relation.having    ? ''        : ' HAVING (' + relation.having + ')';
  var order   = !relation.order     ? ''        : ' ORDER BY ' + relation.order;

  var c = schema.quote_column_name('c');
  var s = schema.quote_column_name('s');

  var table_alias = model.get_table_alias( true );
  var condition   = builder.create_in_condition( table, fks[0], this._parent.get_records_keys(), table_alias + '.' );

  // generate and perform query
  if( fks.length == 1 ) {  // single column fk
    var col = table.get_column( fks[0] ).raw_name;
    var sql = [ 'SELECT ', col, ' AS ', c, ', ', relation.select, ' AS ', s, ' FROM ', table.raw_name, ' ', table_alias,
      where, '(', condition, ') GROUP BY ', col, group, having, order ].join('');

    var command = builder.db_connection.create_command( sql );

    if ( Object.isObject( relation.params ))
      command.bind_values( relation.params );

    var stats = {};
    command.execute( function( e, result ){
      if ( e ) throw e;

      console.log( result.get_all_rows() );
    } );

//    foreach(command.query_all() as row)
//      stats[row['c']]=row['s'];
  }
  else  // composite fk
  {
//    keys=array_keys(records);
//    foreach(keys as &key)
//    {
//      key2=unserialize(key);
//      key=array();
//      foreach(pk_table.primary_key as pk)
//        key[map[pk]]=key2[pk];
//    }
//    cols=array();
//    foreach(pk_table.primary_key as n=>pk)
//    {
//      name=table.columns[map[pk]].raw_name;
//      cols[name]=name.' as '.schema.quote_column_name('c'.n);
//    }
//    sql='select '.implode(', ',cols).", {relation.select} as s from {table.raw_name} ".table_alias
//      .where.'('.builder.create_in_condition(table,fks,keys,table_alias.'.').')'
//      .' group by '.implode(', ',array_keys(cols)).group
//      .having.order;
//    command=builder.get_db_connection().create_command(sql);
//    if(is_array(relation.params))
//      builder.bind_values(command,relation.params);
//    stats=array();
//    foreach(command.query_all() as row)
//    {
//      key=array();
//      foreach(pk_table.primary_key as n=>pk)
//        key[pk]=row['c'.n];
//      stats[serialize(key)]=row['s'];
//    }
  }

  // populate the results into existing records
//  foreach(records as pk=>record)
//    record.add_related_record(relation.name,isset(stats[pk])?stats[pk]:relation.default_value,false);
}









//
//  /*
//   * @param string join_table_name jointablename
//   * @param string keys keys
//   */
//  StatElement.prototype.__query_many_many = function(join_table_name,keys)
//  {
//    relation=this.relation;
//    model=cactive_record::model(relation.class_name);
//    table=model.get_table_schema();
//    builder=model.get_command_builder();
//    schema=builder.get_schema();
//    pk_table=this._parent.model.get_table_schema();
//
//    table_alias=model.get_table_alias(true);
//
//    if((join_table=builder.get_schema().get_table(join_table_name))===null)
//      throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is not specified correctly. the join table "{join_table}" given in the foreign key cannot be found in the database.',
//        array('{class}'=>get_class(this._parent.model), '{relation}'=>relation.name, '{join_table}'=>join_table_name)));
//
//    fks=preg_split('/\s*,\s*/',keys,-1,preg_split_no_empty);
//    if(count(fks)!==count(table.primary_key)+count(pk_table.primary_key))
//      throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//        array('{class}'=>get_class(this._parent.model), '{relation}'=>relation.name)));
//
//    join_condition=array();
//    map=array();
//
//    fk_defined=true;
//    foreach(fks as i=>fk)
//    {
//      if(!isset(join_table.columns[fk]))
//        throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key "{key}". there is no such column in the table "{table}".',
//          array('{class}'=>get_class(this._parent.model), '{relation}'=>relation.name, '{key}'=>fk, '{table}'=>join_table.name)));
//
//      if(isset(join_table.foreign_keys[fk]))
//      {
//        list(table_name,pk)=join_table.foreign_keys[fk];
//        if(!isset(join_condition[pk]) && schema.compare_table_names(table.raw_name,table_name))
//          join_condition[pk]=table_alias.'.'.schema.quote_column_name(pk).'='.join_table.raw_name.'.'.schema.quote_column_name(fk);
//        else if(!isset(map[pk]) && schema.compare_table_names(pk_table.raw_name,table_name))
//          map[pk]=fk;
//        else
//        {
//          fk_defined=false;
//          break;
//        }
//      }
//      else
//      {
//        fk_defined=false;
//        break;
//      }
//    }
//
//    if(!fk_defined)
//    {
//      join_condition=array();
//      map=array();
//      foreach(fks as i=>fk)
//      {
//        if(i<count(pk_table.primary_key))
//        {
//          pk=is_array(pk_table.primary_key) ? pk_table.primary_key[i] : pk_table.primary_key;
//          map[pk]=fk;
//        }
//        else
//        {
//          j=i-count(pk_table.primary_key);
//          pk=is_array(table.primary_key) ? table.primary_key[j] : table.primary_key;
//          join_condition[pk]=table_alias.'.'.schema.quote_column_name(pk).'='.join_table.raw_name.'.'.schema.quote_column_name(fk);
//        }
//      }
//    }
//
//    if(join_condition===array() || map===array())
//      throw new cdb_exception(yii::t('yii','the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//        array('{class}'=>get_class(this._parent.model), '{relation}'=>relation.name)));
//
//    records=this._parent.records;
//
//    cols=array();
//    foreach(is_string(pk_table.primary_key)?array(pk_table.primary_key):pk_table.primary_key as n=>pk)
//    {
//      name=join_table.raw_name.'.'.schema.quote_column_name(map[pk]);
//      cols[name]=name.' as '.schema.quote_column_name('c'.n);
//    }
//
//    keys=array_keys(records);
//    if(is_array(pk_table.primary_key))
//    {
//      foreach(keys as &key)
//      {
//        key2=unserialize(key);
//        key=array();
//        foreach(pk_table.primary_key as pk)
//          key[map[pk]]=key2[pk];
//      }
//    }
//
//    where=empty(relation.condition)?'' : ' where ('.relation.condition.')';
//    group=empty(relation.group)?'' : ', '.relation.group;
//    having=empty(relation.having)?'' : ' and ('.relation.having.')';
//    order=empty(relation.order)?'' : ' order by '.relation.order;
//
//    sql='select '.this.relation.select.' as '.schema.quote_column_name('s').', '.implode(', ',cols)
//      .' from '.table.raw_name.' '.table_alias.' inner join '.join_table.raw_name
//      .' on ('.implode(') and (',join_condition).')'
//      .where
//      .' group by '.implode(', ',array_keys(cols)).group
//      .' having ('.builder.create_in_condition(join_table,map,keys).')'
//      .having.order;
//
//    command=builder.get_db_connection().create_command(sql);
//    if(is_array(relation.params))
//      builder.bind_values(command,relation.params);
//
//    stats=array();
//    foreach(command.query_all() as row)
//    {
//      if(is_array(pk_table.primary_key))
//      {
//        key=array();
//        foreach(pk_table.primary_key as n=>k)
//          key[k]=row['c'.n];
//        stats[serialize(key)]=row['s'];
//      }
//      else
//        stats[row['c0']]=row['s'];
//    }
//
//    foreach(records as pk=>record)
//      record.add_related_record(relation.name,isset(stats[pk])?stats[pk]:this.relation.default_value,false);
//  }
//}
