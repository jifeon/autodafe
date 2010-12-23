var StatElement = module.exports = function( params ) {
  this._init( params );
};


StatElement.prototype._init = function( params ) {
  /**
   * @var cactive_relation the relation represented by this tree node
   */
  this.relation = params.relation;

  this.__finder = params.finder;
  this.__parent = params.parent;

  this.__parent.stats.push( this );
};


///**
// * performs the stat query.
// */
//StatElement.prototype.query = function() {
//  if ( preg_match( '/^\s*(.*?)\((.*)\)\s*/', this.relation.foreign_key, matches ) )
//    this.query_many_many( matches[1], matches[2] );
//  else
//    this.query_one_many();
//}
//
//StatElement.prototype.__query_one_many = function() {
//  relation = this.relation;
//  model = cactive_record::model( relation.class_name );
//  builder = model.get_command_builder();
//  schema = builder.get_schema();
//  table = model.get_table_schema();
//  parent = this._parent;
//  pk_table = parent.model.get_table_schema();
//
//  fks = preg_split( '/[\s,]+/', relation.foreign_key, -1, preg_split_no_empty );
//  if ( count( fks ) !== count( pk_table.primary_key ) )
//    throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key. the columns in the key must match the primary keys of the table "{table}".',
//      array( '{class}' = > get_class( parent.model ), '{relation}' = > relation.name, '{table}' = > pk_table.name
//)))
//  ;
//
//  // set up mapping between fk and pk columns
//  map = array();  // pk=>fk
//  foreach( fks
//  as
//  i =
//>
//  fk
//)
//  {
//    if ( !isset( table.columns[fk] ) )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key "{key}". there is no such column in the table "{table}".',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > relation.name, '{key}' = > fk,'{table}' =
//  >
//    table.name
//  )))
//    ;
//
//    if ( isset( table.foreign_keys[fk] ) ) {
//      list( table_name, pk ) = table.foreign_keys[fk];
//      if ( schema.compare_table_names( pk_table.raw_name, table_name ) )
//        map[pk] = fk;
//      else
//        throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with a foreign key "{key}" that does not point to the parent table "{table}".',
//          array( '{class}' = > get_class( parent.model ), '{relation}' = > relation.name, '{key}' = > fk,'{table}' =
//    >
//      pk_table.name
//    )))
//      ;
//    }
//    else  // fk constraints undefined
//    {
//      if ( is_array( pk_table.primary_key ) ) // composite pk
//        map[pk_table.primary_key[i]] = fk;
//      else
//        map[pk_table.primary_key] = fk;
//    }
//  }
//
//  records = this._parent.records;
//
//  where = empty( relation.condition ) ? '' : ' where ('.relation.condition.
//  ')';
//  group = empty( relation.group ) ? '' : ', '.relation.group;
//  having = empty( relation.having ) ? '' : ' and ('.relation.having.
//  ')';
//  order = empty( relation.order ) ? '' : ' order by '.relation.order;
//
//  c = schema.quote_column_name( 'c' );
//  s = schema.quote_column_name( 's' );
//
//  // generate and perform query
//  if ( count( fks ) === 1 )  // single column fk
//  {
//    col = table.columns[fks[0]].raw_name;
//    sql = "select col as c, {relation.select} as s from {table.raw_name}"
//      .where
//      .
//    " group by col".group
//      .
//    " having ".builder.create_incondition( table, fks[0], array_keys( records ) )
//      .having.order;
//    command = builder.get_dbconnection().create_command( sql );
//    if ( is_array( relation.params ) )
//      builder.bind_values( command, relation.params );
//    stats = array();
//    foreach( command.query_all()
//    as
//    row
//  )
//    stats[row['c']] = row['s'];
//  }
//  else  // composite fk
//  {
//    keys = array_keys( records );
//    foreach( keys
//    as & key
//  )
//    {
//      key2 = unserialize( key );
//      key = array();
//      foreach( pk_table.primary_key
//      as
//      pk
//    )
//      key[map[pk]] = key2[pk];
//    }
//    cols = array();
//    foreach( pk_table.primary_key
//    as
//    n =
//  >
//    pk
//  )
//    {
//      name = table.columns[map[pk]].raw_name;
//      cols[name] = name.
//      ' as '.schema.quote_column_name( 'c'.n );
//    }
//    sql = 'select '.implode( ', ', cols ).
//    ", {relation.select} as s from {table.raw_name}"
//      .where
//      .
//    ' group by '.implode( ', ', array_keys( cols ) ).group
//      .
//    ' having '.builder.create_incondition( table, fks, keys )
//      .having.order;
//    command = builder.get_dbconnection().create_command( sql );
//    if ( is_array( relation.params ) )
//      builder.bind_values( command, relation.params );
//    stats = array();
//    foreach( command.query_all()
//    as
//    row
//  )
//    {
//      key = array();
//      foreach( pk_table.primary_key
//      as
//      n =
//    >
//      pk
//    )
//      key[pk] = row['c'.n];
//      stats[serialize( key )] = row['s'];
//    }
//  }
//
//  // populate the results into existing records
//  foreach( records
//  as
//  pk =
//>
//  record
//)
//  record.add_related_record( relation.name, isset( stats[pk] ) ? stats[pk] : relation.default_value, false );
//}
//
//StatElement.prototype.__query_many_many = function( join_table_name, keys ) {
//  relation = this.relation;
//  model = cactive_record::model( relation.class_name );
//  table = model.get_table_schema();
//  builder = model.get_command_builder();
//  schema = builder.get_schema();
//  pk_table = this._parent.model.get_table_schema();
//
//  if ( (join_table = builder.get_schema().get_table( join_table_name )) === null )
//    throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is not specified correctly. the join table "{join_table}" given in the foreign key cannot be found in the database.',
//      array( '{class}' = > get_class( this._parent.model ), '{relation}' = > relation.name, '{join_table}' = > join_table_name
//)))
//  ;
//
//  fks = preg_split( '/[\s,]+/', keys, -1, preg_split_no_empty );
//  if ( count( fks ) !== count( table.primary_key ) + count( pk_table.primary_key ) )
//    throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//      array( '{class}' = > get_class( this._parent.model ), '{relation}' = > relation.name )
//))
//  ;
//
//  join_condition = array();
//  map = array();
//
//  fk_defined = true;
//  foreach( fks
//  as
//  i =
//>
//  fk
//)
//  {
//    if ( !isset( join_table.columns[fk] ) )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key "{key}". there is no such column in the table "{table}".',
//        array( '{class}' = > get_class( this._parent.model ), '{relation}' = > relation.name, '{key}' = > fk,'{table}' =
//  >
//    join_table.name
//  )))
//    ;
//
//    if ( isset( join_table.foreign_keys[fk] ) ) {
//      list( table_name, pk ) = join_table.foreign_keys[fk];
//      if ( !isset( join_condition[pk] ) && schema.compare_table_names( table.raw_name, table_name ) )
//        join_condition[pk] = table.raw_name.
//      '.'.schema.quote_column_name( pk ).
//      '='.join_table.raw_name.
//      '.'.schema.quote_column_name( fk );
//    else
//      if ( !isset( map[pk] ) && schema.compare_table_names( pk_table.raw_name, table_name ) )
//        map[pk] = fk;
//      else {
//        fk_defined = false;
//        break;
//      }
//    }
//    else {
//      fk_defined = false;
//      break;
//    }
//  }
//
//  if ( !fk_defined ) {
//    die( '????' );
//    join_condition = array();
//    map = array();
//    foreach( fks
//    as
//    i =
//  >
//    fk
//  )
//    {
//      if ( i < count( pk_table.primary_key ) ) {
//        pk = is_array( pk_table.primary_key ) ? pk_table.primary_key[i] : pk_table.primary_key;
//        map[pk] = fk;
//      }
//      else {
//        j = i - count( pk_table.primary_key );
//        pk = is_array( table.primary_key ) ? table.primary_key[j] : table.primary_key;
//        join_condition[pk] = table.raw_name.
//        '.'.schema.quote_column_name( pk ).
//        '='.join_table.raw_name.
//        '.'.schema.quote_column_name( fk );
//      }
//    }
//  }
//
//  if ( join_condition === array() || map === array() )
//    throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//      array( '{class}' = > get_class( this._parent.model ), '{relation}' = > relation.name )
//))
//  ;
//
//  records = this._parent.records;
//
//  cols = array();
//  foreach( is_string( pk_table.primary_key ) ? array( pk_table.primary_key ) : pk_table.primary_key
//  as
//  n =
//>
//  pk
//)
//  {
//    name = join_table.raw_name.
//    '.'.schema.quote_column_name( map[pk] );
//    cols[name] = name.
//    ' as '.schema.quote_column_name( 'c'.n );
//  }
//
//  keys = array_keys( records );
//  if ( is_array( pk_table.primary_key ) ) {
//    foreach( keys
//    as & key
//  )
//    {
//      key2 = unserialize( key );
//      key = array();
//      foreach( pk_table.primary_key
//      as
//      pk
//    )
//      key[map[pk]] = key2[pk];
//    }
//  }
//
//  where = empty( relation.condition ) ? '' : ' where ('.relation.condition.
//  ')';
//  group = empty( relation.group ) ? '' : ', '.relation.group;
//  having = empty( relation.having ) ? '' : ' and ('.relation.having.
//  ')';
//  order = empty( relation.order ) ? '' : ' order by '.relation.order;
//
//  sql = 'select '.
//  this.relation.select.
//  ' as '.schema.quote_column_name( 's' ).
//  ', '.implode( ', ', cols )
//    .
//  ' from '.table.raw_name.
//  ' inner join '.join_table.raw_name
//    .
//  ' on ('.implode( ') and (', join_condition ).
//  ')'
//    .where
//    .
//  ' group by '.implode( ', ', array_keys( cols ) ).group
//    .
//  ' having ('.builder.create_incondition( join_table, map, keys ).
//  ')'
//    .having.order;
//
//  command = builder.get_dbconnection().create_command( sql );
//  if ( is_array( relation.params ) )
//    builder.bind_values( command, relation.params );
//
//  stats = array();
//  foreach( command.query_all()
//  as
//  row
//)
//  {
//    if ( is_array( pk_table.primary_key ) ) {
//      key = array();
//      foreach( pk_table.primary_key
//      as
//      n =
//    >
//      k
//    )
//      key[k] = row['c'.n];
//      stats[serialize( key )] = row['s'];
//    }
//    else
//      stats[row['c0']] = row['s'];
//  }
//
//  foreach( records
//  as
//  pk =
//>
//  record
//)
//  record.add_related_record( relation.name, isset( stats[pk] ) ? stats[pk] : this.relation.default_value, false );
//}
