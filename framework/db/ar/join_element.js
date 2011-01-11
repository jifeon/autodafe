var ActiveRecord = require( './active_record' );

var JoinElement = module.exports = function( params ) {
  this._init( params );
};


JoinElement.prototype._init = function( params ) {
  /**
   * @var integer the unique ID of this tree node
   */
  this.id       = params.id || 0;
  /**
   * @var CActiveRelation the relation represented by this tree node
   */
  this.relation = null;
  /**
   * @var CActiveRecord the model associated with this tree node
   */
  this.model    = null;
  /**
   * @var array list of active records found by the queries. They are indexed by primary key values.
   */
  this.records  = {};
  /**
   * @var array list of child join elements
   */
  this.children = [];
  /**
   * @var array list of stat elements
   * @since 1.0.4
   */
  this.stats    = [];
  /**
   * @var string table alias for this join element
   */
  this.table_alias      = null;
  /**
   * @var string the quoted table alias for this element
   */
  this.raw_table_alias  = null;

  this.__finder         = params.finder;
  this.__builder        = null;
  this.__parent         = null;
  this.__pk_alias       = null;   // string or name=>alias
  this.__column_aliases = null;   // name=>alias
  this.__joined         = false;
  this.__table          = null;
  this.__related        = {};     // PK, relation name, related PK => true

  var parent = params.parent;
  if( parent != null ) {
    this.relation         = params.relation;
    this.__parent         = parent;
    this.__builder        = parent.__builder;
    this.table_alias      = this.relation.alias == null ? this.relation.name : this.relation.alias;
    this.raw_table_alias  = this.__builder.get_schema().quote_table_name( this.table_alias );
    this.model            = ActiveRecord.model( this.relation.class_name );
    this.__table          = this.model.get_table_schema();
  }
  else  // root element, the first parameter is the model.
  {
    this.model            = params.relation;
    this.__builder        = this.model.get_command_builder();
    this.__table          = this.model.get_table_schema();
    this.table_alias      = 't';
    this.raw_table_alias  = this.__builder.get_schema().quote_table_name( 't' );
  }

  // set up column aliases, such as t1_c2
  var table   = this.__table;
  var prefix  = 't' + this.id + '_c';

  var column_names = table.get_column_names();

  for ( var key = 0, key_ln = column_names.length; key < key_ln; key++ ) {
    var name = column_names[ key ];

    var alias = prefix + key;
    this.__column_aliases[ name ] = alias;

    if( table.primary_key == name )     this.__pk_alias = alias;
    else if ( table.primary_key instanceof Array && table.primary_key.indexOf( name ) != -1 )
      this.__pk_alias[ name ] = alias;
  }
};

//
///**
// * performs the recursive finding with the criteria.
// * @param cdb_criteria the query criteria
// */
//JoinElement.prototype.find = function( criteria = null ) {
//  if ( this._parent === null ) // root element
//  {
//    query = new cjoin_query( this, criteria );
//    this._finder.base_limited = (criteria.offset >= 0 || criteria.limit >= 0);
//    this.build_query( query );
//    this._finder.base_limited = false;
//    this.run_query( query );
//  }
//  else if ( !this._joined && !empty( this._parent.records ) ) // not joined before
//  {
//    query = new cjoin_query( this._parent );
//    this._joined = true;
//    query.join( this );
//    this.build_query( query );
//    this._parent.run_query( query );
//  }
//
//  foreach( this.children
//  as
//  child
//) // find recursively
//  child.find();
//
//  foreach( this.stats
//  as
//  stat
//)
//  stat.query();
//}
//
///**
// * performs lazy find with the specified base record.
// * @param cactive_record the active record whose related object is to be fetched.
// */
//JoinElement.prototype.lazy_find = function( base_record ) {
//  if ( is_string( this._table.primary_key ) )
//    this.records[base_record.
//  {
//    this._table.primary_key
//  }
//]
//  = base_record;
//else
//  {
//    pk = array();
//    foreach( this._table.primary_key
//    as
//    name
//  )
//    pk[name] = base_record.name;
//    this.records[serialize( pk )] = base_record;
//  }
//
//  foreach( this.stats
//  as
//  stat
//)
//  stat.query();
//
//  if ( empty( this.children ) )
//    return;
//
//  child = reset( this.children );
//  query = new cjoin_query( child );
//  query.selects = array();
//  query.selects[] = child.get_column_select( child.relation.select );
//  query.conditions = array();
//  query.conditions[] = child.relation.condition;
//  query.conditions[] = child.relation.on;
//  query.groups[] = child.relation.group;
//  query.havings[] = child.relation.having;
//  query.orders[] = child.relation.order;
//  if ( is_array( child.relation.params ) )
//    query.params = child.relation.params;
//  query.elements[child.id] = true;
//  if ( child.relation instanceof chas_many_relation ) {
//    query.limit = child.relation.limit;
//    query.offset = child.relation.offset;
//  }
//
//  child.apply_lazy_condition( query, base_record );
//
//  this._joined = true;
//  child._joined = true;
//
//  this._finder.base_limited = false;
//  child.build_query( query );
//  child.run_query( query );
//  foreach( child.children
//  as
//  c
//)
//  c.find();
//
//  if ( empty( child.records ) )
//    return;
//  if ( child.relation instanceof chas_one_relation || child.relation instanceof cbelongs_torelation )
//    base_record.add_related_record( child.relation.name, reset( child.records ), false );
//  else // has_many and many_many
//  {
//    foreach( child.records
//    as
//    record
//  )
//    {
//      if ( child.relation.index !== null )
//        index = record.
//      {
//        child.relation.index
//      }
//      ;
//    else
//      index = true;
//      base_record.add_related_record( child.relation.name, record, index );
//    }
//  }
//}
//
//JoinElement.prototype.__apply_lazy_condition = function( query, record ) {
//  schema = this._builder.get_schema();
//  parent = this._parent;
//  if ( this.relation instanceof cmany_many_relation ) {
//    if ( !preg_match( '/^\s*(.*?)\((.*)\)\s*/', this.relation.foreign_key, matches ) )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key. the format of the foreign key must be "join_table(fk1,fk2,...)".',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name )
//  ))
//    ;
//
//    if ( (join_table = schema.get_table( matches[1] )) === null )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is not specified correctly: the join table "{join_table}" given in the foreign key cannot be found in the database.',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name, '{join_table}' = > matches[1]
//  )))
//    ;
//    fks = preg_split( '/[\s,]+/', matches[2], -1, preg_split_no_empty );
//
//
//    join_alias = schema.quote_table_name( this.relation.name.
//    '_'.
//    this.table_alias
//  )
//    ;
//    parent_condition = array();
//    child_condition = array();
//    count = 0;
//    params = array();
//
//    fk_defined = true;
//    foreach( fks
//    as
//    i =
//  >
//    fk
//  )
//    {
//      if ( isset( join_table.foreign_keys[fk] ) )  // fk defined
//      {
//        list( table_name, pk ) = join_table.foreign_keys[fk];
//        if ( !isset( parent_condition[pk] ) && schema.compare_table_names( parent._table.raw_name, table_name ) ) {
//          parent_condition[pk] = join_alias.
//          '.'.schema.quote_column_name( fk ).
//          '=:ypl'.count;
//          params[':ypl'.count] = record.pk;
//          count++;
//        }
//        else if ( !isset( child_condition[pk] ) && schema.compare_table_names( this._table.raw_name, table_name ) )
//          child_condition[pk] = this.get_column_prefix().schema.quote_column_name( pk ).
//        '='.join_alias.
//        '.'.schema.quote_column_name( fk );
//      else
//        {
//          fk_defined = false;
//          break;
//        }
//      }
//      else {
//        fk_defined = false;
//        break;
//      }
//    }
//
//    if ( !fk_defined ) {
//      parent_condition = array();
//      child_condition = array();
//      count = 0;
//      params = array();
//      foreach( fks
//      as
//      i =
//    >
//      fk
//    )
//      {
//        if ( i < count( parent._table.primary_key ) ) {
//          pk = is_array( parent._table.primary_key ) ? parent._table.primary_key[i] : parent._table.primary_key;
//          parent_condition[pk] = join_alias.
//          '.'.schema.quote_column_name( fk ).
//          '=:ypl'.count;
//          params[':ypl'.count] = record.pk;
//          count++;
//        }
//        else {
//          j = i - count( parent._table.primary_key );
//          pk = is_array( this._table.primary_key ) ? this._table.primary_key[j] : this._table.primary_key;
//          child_condition[pk] = this.get_column_prefix().schema.quote_column_name( pk ).
//          '='.join_alias.
//          '.'.schema.quote_column_name( fk );
//        }
//      }
//    }
//
//    if ( parent_condition !== array() && child_condition !== array() ) {
//      join = 'inner join '.join_table.raw_name.
//      ' '.join_alias.
//      ' on ';
//      join. = '('.implode( ') and (', parent_condition ).
//      ') and ('.implode( ') and (', child_condition ).
//      ')';
//      if ( !empty( this.relation.on ) )
//        join. = ' and ('.
//      this.relation.on.
//      ')';
//      query.joins[] = join;
//      foreach( params
//      as
//      name =
//    >
//      value
//    )
//      query.params[name] = value;
//    }
//    else
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name )
//  ))
//    ;
//  }
//  else {
//    fks = preg_split( '/[\s,]+/', this.relation.foreign_key, -1, preg_split_no_empty );
//    params = array();
//    foreach( fks
//    as
//    i =
//  >
//    fk
//  )
//    {
//      if ( this.relation instanceof cbelongs_torelation ) {
//        if ( isset( parent._table.foreign_keys[fk] ) )  // fk defined
//          pk = parent._table.foreign_keys[fk][1];
//        else if ( is_array( this._table.primary_key ) ) // composite pk
//          pk = this._table.primary_key[i];
//        else
//          pk = this._table.primary_key;
//        params[pk] = record.fk;
//      }
//      else {
//        if ( isset( this._table.foreign_keys[fk] ) )  // fk defined
//          pk = this._table.foreign_keys[fk][1];
//        else if ( is_array( parent._table.primary_key ) ) // composite pk
//          pk = parent._table.primary_key[i];
//        else
//          pk = parent._table.primary_key;
//        params[fk] = record.pk;
//      }
//    }
//    prefix = this.get_column_prefix();
//    count = 0;
//    foreach( params
//    as
//    name =
//  >
//    value
//  )
//    {
//      query.conditions[] = prefix.schema.quote_column_name( name ).
//      '=:ypl'.count;
//      query.params[':ypl'.count] = value;
//      count++;
//    }
//  }
//}
//
///**
// * performs the eager loading with the base records ready.
// * @param mixed the available base record(s).
// */
//JoinElement.prototype.find_with_base = function( base_records ) {
//  if ( !is_array( base_records ) )
//    base_records = array( base_records );
//  if ( is_string( this._table.primary_key ) ) {
//    foreach( base_records
//    as
//    base_record
//  )
//    this.records[base_record.
//    {
//      this._table.primary_key
//    }
//  ]
//    = base_record;
//  }
//  else {
//    foreach( base_records
//    as
//    base_record
//  )
//    {
//      pk = array();
//      foreach( this._table.primary_key
//      as
//      name
//    )
//      pk[name] = base_record.name;
//      this.records[serialize( pk )] = base_record;
//    }
//  }
//
//  query = new cjoin_query( this );
//  this.build_query( query );
//  if ( count( query.joins ) > 1 )
//    this.run_query( query );
//  foreach( this.children
//  as
//  child
//)
//  child.find();
//
//  foreach( this.stats
//  as
//  stat
//)
//  stat.query();
//}
//
///**
// * count the number of primary records returned by the join statement.
// * @param cdb_criteria the query criteria
// * @return integer number of primary records.
// * @since 1.0.3
// */
//JoinElement.prototype.count = function( criteria = null ) {
//  query = new cjoin_query( this, criteria );
//  // ensure only one big join statement is used
//  this._finder.base_limited = false;
//  this._finder.join_all = true;
//  this.build_query( query );
//
//  select = is_array( criteria.select ) ? implode( ',', criteria.select ) : criteria.select;
//  if ( select !== '*' && !strncasecmp( select, 'count', 5 ) )
//    query.selects = array( select );
//  else if ( is_string( this._table.primary_key ) ) {
//    prefix = this.get_column_prefix();
//    schema = this._builder.get_schema();
//    column = prefix.schema.quote_column_name( this._table.primary_key );
//    query.selects = array( "count(distinct column)" );
//  }
//  else
//    query.selects = array( "count(*)" );
//
//  query.orders = query.groups = query.havings = array();
//  query.limit = query.offset = -1;
//  command = query.create_command( this._builder );
//  return command.query_scalar();
//}
//
///**
// * calls {@link cactive_record::before_find}.
// * @since 1.0.11
// */
//JoinElement.prototype.before_find = function() {
//  this.model.before_find_internal();
//}
//
///**
// * calls {@link cactive_record::after_find} of all the records.
// * @since 1.0.3
// */
//JoinElement.prototype.after_find = function() {
//  foreach( this.records
//  as
//  record
//)
//  record.after_find_internal();
//  foreach( this.children
//  as
//  child
//)
//  child.after_find();
//}
//
///**
// * builds the join query with all descendant has_one and belongs_to nodes.
// * @param cjoin_query the query being built up
// */
//JoinElement.prototype.build_query = function( query ) {
//  foreach( this.children
//  as
//  child
//)
//  {
//    if ( child.relation instanceof chas_one_relation || child.relation instanceof cbelongs_torelation
//      || this._finder.join_all || !this._finder.base_limited && child.relation.together ) {
//      child._joined = true;
//      query.join( child );
//      child.build_query( query );
//    }
//  }
//}
//
///**
// * executes the join query and populates the query results.
// * @param cjoin_query the query to be executed.
// */
//JoinElement.prototype.run_query = function( query ) {
//  command = query.create_command( this._builder );
//  foreach( command.query_all()
//  as
//  row
//)
//  this.populate_record( query, row );
//}
//
///**
// * populates the active records with the query data.
// * @param cjoin_query the query executed
// * @param array a row of data
// * @return cactive_record the populated record
// */
//JoinElement.prototype.__populate_record = function( query, row ) {
//  // determine the primary key value
//  if ( is_string( this._pk_alias ) )  // single key
//  {
//    if ( isset( row[this._pk_alias] ) )
//      pk = row[this._pk_alias];
//    else  // no matching related objects
//      return null;
//  }
//  else // is_array, composite key
//  {
//    pk = array();
//    foreach( this._pk_alias
//    as
//    name =
//  >
//    alias
//  )
//    {
//      if ( isset( row[alias] ) )
//        pk[name] = row[alias];
//      else  // no matching related objects
//        return null;
//    }
//    pk = serialize( pk );
//  }
//
//  // retrieve or populate the record according to the primary key value
//  if ( isset( this.records[pk] ) )
//    record = this.records[pk];
//  else {
//    attributes = array();
//    aliases = array_flip( this._column_aliases );
//    foreach( row
//    as
//    alias =
//  >
//    value
//  )
//    {
//      if ( isset( aliases[alias] ) )
//        attributes[aliases[alias]] = value;
//    }
//    record = this.model.populate_record( attributes, false );
//    foreach( this.children
//    as
//    child
//  )
//    record.add_related_record( child.relation.name, null, child.relation instanceof chas_many_relation );
//    this.records[pk] = record;
//  }
//
//  // populate child records recursively
//  foreach( this.children
//  as
//  child
//)
//  {
//    if ( !isset( query.elements[child.id] ) )
//      continue;
//    child_record = child.populate_record( query, row );
//    if ( child.relation instanceof chas_one_relation || child.relation instanceof cbelongs_torelation )
//      record.add_related_record( child.relation.name, child_record, false );
//    else // has_many and many_many
//    {
//      // need to double check to avoid adding duplicated related objects
//      if ( child_record instanceof cactive_record )
//        fpk = serialize( child_record.get_primary_key() );
//      else
//        fpk = 0;
//      if ( !isset( this._related[pk][child.relation.name][fpk] ) ) {
//        if ( child_record instanceof cactive_record && child.relation.index !== null )
//          index = child_record.
//        {
//          child.relation.index
//        }
//        ;
//      else
//        index = true;
//        record.add_related_record( child.relation.name, child_record, index );
//        this._related[pk][child.relation.name][fpk] = true;
//      }
//    }
//  }
//
//  return record;
//}
//
///**
// * @return string the table name and the table alias (if any). this can be used directly in sql query without escaping.
// */
//JoinElement.prototype.get_table_name_with_alias = function() {
//  if ( this.table_alias !== null )
//    return this._table.raw_name.
//  ' '.
//  this.raw_table_alias;
//else
//  return this._table.raw_name;
//}
//
///**
// * generates the list of columns to be selected.
// * columns will be properly aliased and primary keys will be added to selection if they are not specified.
// * @param mixed columns to be selected. defaults to '*', indicating all columns.
// * @return string the column selection
// */
//JoinElement.prototype.get_column_select = function( select = '*' ) {
//  schema = this._builder.get_schema();
//  prefix = this.get_column_prefix();
//  columns = array();
//  if ( select === '*' ) {
//    foreach( this._table.get_column_names()
//    as
//    name
//  )
//    columns[] = prefix.schema.quote_column_name( name ).
//    ' as '.schema.quote_column_name( this._column_aliases[name] );
//  }
//  else {
//    if ( is_string( select ) )
//      select = explode( ',', select );
//    selected = array();
//    foreach( select
//    as
//    name
//  )
//    {
//      name = trim( name );
//      matches = array();
//      if ( (pos = strrpos( name, '.' )) !== false )
//        key = substr( name, pos + 1 );
//      else
//        key = name;
//
//      if ( key === '*' ) {
//        foreach( this._table.get_column_names()
//        as
//        name
//      )
//        columns[] = prefix.schema.quote_column_name( name ).
//        ' as '.schema.quote_column_name( this._column_aliases[name] );
//        continue;
//      }
//
//      if ( isset( this._column_aliases[key] ) )  // simple column names
//      {
//        columns[] = prefix.schema.quote_column_name( key ).
//        ' as '.schema.quote_column_name( this._column_aliases[key] );
//        selected[this._column_aliases[key]] = 1;
//      }
//      else if ( preg_match( '/^(.*?)\s+as\s+(\w+)/i', name, matches ) ) // if the column is already aliased
//      {
//        alias = matches[2];
//        if ( !isset( this._column_aliases[alias] ) || this._column_aliases[alias] !== alias ) {
//          this._column_aliases[alias] = alias;
//          columns[] = name;
//          selected[alias] = 1;
//        }
//      }
//      else
//        throw new cdb_exception( yii::t( 'yii', 'active record "{class}" is trying to select an invalid column "{column}". note, the column must exist in the table or be an expression with alias.',
//          array( '{class}' = > get_class( this.model ), '{column}' = > name )
//    ))
//      ;
//    }
//    // add primary key selection if they are not selected
//    if ( is_string( this._pk_alias ) && !isset( selected[this._pk_alias] ) )
//      columns[] = prefix.schema.quote_column_name( this._table.primary_key ).
//    ' as '.schema.quote_column_name( this._pk_alias );
//  else
//    if ( is_array( this._pk_alias ) ) {
//      foreach( this._table.primary_key
//      as
//      name
//    )
//      if ( !isset( selected[name] ) )
//        columns[] = prefix.schema.quote_column_name( name ).
//      ' as '.schema.quote_column_name( this._pk_alias[name] );
//    }
//  }
//
//  return implode( ', ', columns );
//}
//
///**
// * @return string the primary key selection
// */
//JoinElement.prototype.get_primary_key_select = function() {
//  schema = this._builder.get_schema();
//  prefix = this.get_column_prefix();
//  columns = array();
//  if ( is_string( this._pk_alias ) )
//    columns[] = prefix.schema.quote_column_name( this._table.primary_key ).
//  ' as '.schema.quote_column_name( this._pk_alias );
//else
//  if ( is_array( this._pk_alias ) ) {
//    foreach( this._pk_alias
//    as
//    name =
//  >
//    alias
//  )
//    columns[] = prefix.schema.quote_column_name( name ).
//    ' as '.schema.quote_column_name( alias );
//  }
//  return implode( ', ', columns );
//}
//
///**
// * @return string the condition that specifies only the rows with the selected primary key values.
// */
//JoinElement.prototype.get_primary_key_range = function() {
//  if ( empty( this.records ) )
//    return '';
//  values = array_keys( this.records );
//  if ( is_array( this._table.primary_key ) ) {
//    foreach( values
//    as & value
//  )
//    value = unserialize( value );
//  }
//  return this._builder.create_incondition( this._table, this._table.primary_key, values, this.get_column_prefix() );
//}
//
///**
// * @return string the column prefix for column reference disambiguation
// */
//JoinElement.prototype.get_column_prefix = function() {
//  if ( this.table_alias !== null )
//    return this.raw_table_alias.
//  '.';
//else
//  return this._table.raw_name.
//  '.';
//}
//
///**
// * @return string the join statement (this node joins with its parent)
// */
//JoinElement.prototype.get_join_condition = function() {
//  parent = this._parent;
//  relation = this.relation;
//  if ( this.relation instanceof cmany_many_relation ) {
//    if ( !preg_match( '/^\s*(.*?)\((.*)\)\s*/', this.relation.foreign_key, matches ) )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key. the format of the foreign key must be "join_table(fk1,fk2,...)".',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name )
//  ))
//    ;
//
//    schema = this._builder.get_schema();
//    if ( (join_table = schema.get_table( matches[1] )) === null )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is not specified correctly: the join table "{join_table}" given in the foreign key cannot be found in the database.',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name, '{join_table}' = > matches[1]
//  )))
//    ;
//    fks = preg_split( '/[\s,]+/', matches[2], -1, preg_split_no_empty );
//
//    return this.join_many_many( join_table, fks, parent );
//  }
//  else {
//    fks = preg_split( '/[\s,]+/', relation.foreign_key, -1, preg_split_no_empty );
//    if ( this.relation instanceof cbelongs_torelation ) {
//      pke = this;
//      fke = parent;
//    }
//    else {
//      pke = parent;
//      fke = this;
//    }
//    return this.join_one_many( fke, fks, pke, parent );
//  }
//}
//
///**
// * generates the join statement for one-many relationship.
// * this works for has_one, has_many and belongs_to.
// * @param cjoin_element the join element containing foreign keys
// * @param array the foreign keys
// * @param cjoin_element the join element containg primary keys
// * @param cjoin_element the parent join element
// * @return string the join statement
// * @throws cdb_exception if a foreign key is invalid
// */
//JoinElement.prototype.__join_one_many = function( fke, fks, pke, parent ) {
//  schema = this._builder.get_schema();
//  joins = array();
//  foreach( fks
//  as
//  i =
//>
//  fk
//)
//  {
//    if ( !isset( fke._table.columns[fk] ) )
//      throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an invalid foreign key "{key}". there is no such column in the table "{table}".',
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name, '{key}' = > fk,'{table}' =
//  >
//    fke._table.name
//  )))
//    ;
//
//    if ( isset( fke._table.foreign_keys[fk] ) )
//      pk = fke._table.foreign_keys[fk][1];
//    else  // fk constraints undefined
//    {
//      if ( is_array( pke._table.primary_key ) ) // composite pk
//        pk = pke._table.primary_key[i];
//      else
//        pk = pke._table.primary_key;
//    }
//    joins[] = fke.get_column_prefix().schema.quote_column_name( fk ).
//    '='.pke.get_column_prefix().schema.quote_column_name( pk );
//  }
//  if ( !empty( this.relation.on ) )
//    joins[] = this.relation.on;
//  return this.relation.join_type.
//  ' '.
//  this.get_table_name_with_alias().
//  ' on ('.implode( ') and (', joins ).
//  ')';
//}
//
///**
// * generates the join statement for many-many relationship.
// * @param cdb_table_schema the join table
// * @param array the foreign keys
// * @param cjoin_element the parent join element
// * @return string the join statement
// * @throws cdb_exception if a foreign key is invalid
// */
//JoinElement.prototype.__join_many_many = function( join_table, fks, parent ) {
//  schema = this._builder.get_schema();
//  join_alias = schema.quote_table_name( this.relation.name.
//  '_'.
//  this.table_alias
//)
//  ;
//  parent_condition = array();
//  child_condition = array();
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
//        array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name, '{key}' = > fk,'{table}' =
//  >
//    join_table.name
//  )))
//    ;
//
//    if ( isset( join_table.foreign_keys[fk] ) ) {
//      list( table_name, pk ) = join_table.foreign_keys[fk];
//      if ( !isset( parent_condition[pk] ) && schema.compare_table_names( parent._table.raw_name, table_name ) )
//        parent_condition[pk] = parent.get_column_prefix().schema.quote_column_name( pk ).
//      '='.join_alias.
//      '.'.schema.quote_column_name( fk );
//    else
//      if ( !isset( child_condition[pk] ) && schema.compare_table_names( this._table.raw_name, table_name ) )
//        child_condition[pk] = this.get_column_prefix().schema.quote_column_name( pk ).
//      '='.join_alias.
//      '.'.schema.quote_column_name( fk );
//    else
//      {
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
//    parent_condition = array();
//    child_condition = array();
//    foreach( fks
//    as
//    i =
//  >
//    fk
//  )
//    {
//      if ( i < count( parent._table.primary_key ) ) {
//        pk = is_array( parent._table.primary_key ) ? parent._table.primary_key[i] : parent._table.primary_key;
//        parent_condition[pk] = parent.get_column_prefix().schema.quote_column_name( pk ).
//        '='.join_alias.
//        '.'.schema.quote_column_name( fk );
//      }
//      else {
//        j = i - count( parent._table.primary_key );
//        pk = is_array( this._table.primary_key ) ? this._table.primary_key[j] : this._table.primary_key;
//        child_condition[pk] = this.get_column_prefix().schema.quote_column_name( pk ).
//        '='.join_alias.
//        '.'.schema.quote_column_name( fk );
//      }
//    }
//  }
//
//  if ( parent_condition !== array() && child_condition !== array() ) {
//    join = this.relation.join_type.
//    ' '.join_table.raw_name.
//    ' '.join_alias;
//    join. = ' on ('.implode( ') and (', parent_condition ).
//    ')';
//    join. = ' '.
//    this.relation.join_type.
//    ' '.
//    this.get_table_name_with_alias();
//    join. = ' on ('.implode( ') and (', child_condition ).
//    ')';
//    if ( !empty( this.relation.on ) )
//      join. = ' and ('.
//    this.relation.on.
//    ')';
//    return join;
//  }
//  else
//    throw new cdb_exception( yii::t( 'yii', 'the relation "{relation}" in active record class "{class}" is specified with an incomplete foreign key. the foreign key must consist of columns referencing both joining tables.',
//      array( '{class}' = > get_class( parent.model ), '{relation}' = > this.relation.name )
//))
//  ;
//}
