var JoinElement   = require( './join_element' );
var StatElement   = require( './stat_element' );
var ActiveRecord  = require( 'ar/active_record' );

var ActiveFinder = module.exports = function( params ) {
  this._init( params );
};


ActiveFinder.prototype._init = function( params ) {
  /**
   * @var boolean join all tables all at once. Defaults to false.
   * This property is internally used.
   * @since 1.0.2
   */
  this.join_all     = false;
  /**
   * @var boolean whether the base model has limit or offset.
   * This property is internally used.
   * @since 1.0.2
   */
  this.base_limited = false;

  this.__joinCount  = 0;
  this.__joinTree   = new JoinElement({
    finder    : this,
    relation  : params.model
  });
  this.__builder    = params.model.get_command_builder();

  this.build_join_tree( this.__joinTree, params._with );
};


///**
// * uses the most aggressive join approach.
// * by calling this method, even if there is limit/offset option set for
// * the primary table query, we will still use a single sql statement.
// * by default (_without calling this method), the primary table will be queried
// * by itself so that limit/offset can be correctly applied.
// * @return cactive_finder the finder object
// * @since 1.0.2
// */
//ActiveFinder.prototype.together = function() {
//  this.join_all = true;
//  return this;
//}
//
///**
// * performs the relational query based on the given db criteria.
// * do not call this method. this method is used internally.
// * @param cdb_criteria the db criteria
// * @param boolean whether to bring back all records
// * @return mixed the query result
// */
//ActiveFinder.prototype.query = function( criteria, all = false ) {
//  this._join_tree.model.apply_scopes( criteria );
//  this._join_tree.before_find();
//
//  alias = criteria.alias === null ? 't' : criteria.alias;
//  this._join_tree.table_alias = alias;
//  this._join_tree.raw_table_alias = this._builder.get_schema().quote_table_name( alias );
//
//  this._join_tree.find( criteria );
//  this._join_tree.after_find();
//
//  if ( all )
//    return array_values( this._join_tree.records );
//  else if ( count( this._join_tree.records ) )
//    return reset( this._join_tree.records );
//  else
//    return null;
//}
//
///**
// * this is the relational version of {@link cactive_record::find()}.
// */
//ActiveFinder.prototype.find = function( condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_criteria( condition, params );
//  return this.query( criteria );
//}
//
///**
// * this is the relational version of {@link cactive_record::find_all()}.
// */
//ActiveFinder.prototype.find_all = function( condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_all() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_criteria( condition, params );
//  return this.query( criteria, true );
//}
//
///**
// * this is the relational version of {@link cactive_record::find_bypk()}.
// */
//ActiveFinder.prototype.find_bypk = function( pk, condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_bypk() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_pkcriteria( this._join_tree.model.get_table_schema(), pk, condition, params, this._join_tree.raw_table_alias.
//  '.'
//)
//  ;
//  return this.query( criteria );
//}
//
///**
// * this is the relational version of {@link cactive_record::find_all_bypk()}.
// */
//ActiveFinder.prototype.find_all_bypk = function( pk, condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_all_bypk() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_pkcriteria( this._join_tree.model.get_table_schema(), pk, condition, params, this._join_tree.raw_table_alias.
//  '.'
//)
//  ;
//  return this.query( criteria, true );
//}
//
///**
// * this is  the relational version of {@link cactive_record::find_byattributes()}.
// */
//ActiveFinder.prototype.find_byattributes = function( attributes, condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_byattributes() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_column_criteria( this._join_tree.model.get_table_schema(), attributes, condition, params, this._join_tree.raw_table_alias.
//  '.'
//)
//  ;
//  return this.query( criteria );
//}
//
///**
// * this is the relational version of {@link cactive_record::find_all_byattributes()}.
// */
//ActiveFinder.prototype.find_all_byattributes = function( attributes, condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_all_byattributes() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_column_criteria( this._join_tree.model.get_table_schema(), attributes, condition, params, this._join_tree.raw_table_alias.
//  '.'
//)
//  ;
//  return this.query( criteria, true );
//}
//
///**
// * this is the relational version of {@link cactive_record::find_bysql()}.
// */
//ActiveFinder.prototype.find_bysql = function( sql, params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_bysql() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  if ( (row = this._builder.create_sql_command( sql, params ).query_row()) !== false ) {
//    base_record = this._join_tree.model.populate_record( row, false );
//    this._join_tree.before_find();
//    this._join_tree.find__with_base( base_record );
//    this._join_tree.after_find();
//    return base_record;
//  }
//}
//
///**
// * this is the relational version of {@link cactive_record::find_all_bysql()}.
// */
//ActiveFinder.prototype.find_all_bysql = function( sql, params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.find_all_bysql() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  if ( (rows = this._builder.create_sql_command( sql, params ).query_all()) !== array() ) {
//    base_records = this._join_tree.model.populate_records( rows, false );
//    this._join_tree.before_find();
//    this._join_tree.find__with_base( base_records );
//    this._join_tree.after_find();
//    return base_records;
//  }
//  else
//    return array();
//}
//
///**
// * this is the relational version of {@link cactive_record::count()}.
// * @since 1.0.3
// */
//ActiveFinder.prototype.count = function( condition = '', params = array() ) {
//  yii::trace( get_class( this._join_tree.model ).
//  '.count() eagerly','system.db.ar.cactive_record'
//)
//  ;
//  criteria = this._builder.create_criteria( condition, params );
//  this._join_tree.model.apply_scopes( criteria );
//
//  alias = criteria.alias === null ? 't' : criteria.alias;
//  this._join_tree.table_alias = alias;
//  this._join_tree.raw_table_alias = this._builder.get_schema().quote_table_name( alias );
//
//  return this._join_tree.count( criteria );
//}
//
///**
// * finds the related objects for the specified active record.
// * this method is internally invoked by {@link cactive_record} to support lazy loading.
// * @param cactive_record the base record whose related objects are to be loaded
// */
//ActiveFinder.prototype.lazy_find = function( base_record ) {
//  this._join_tree.lazy_find( base_record );
//  if ( !empty( this._join_tree.children ) ) {
//    child = reset( this._join_tree.children );
//    child.after_find();
//  }
//}
//
/**
* builds up the join tree representing the relationships involved in this query.
* @param cjoin_element the parent tree node
* @param mixed the names of the related objects relative to the parent tree node
* @param array additional query options to be merged _with the relation
*/
ActiveFinder.prototype.__build_join_tree = function( parent, _with, options ) {
  options = options || null;

  if ( parent instanceof StatElement )
    throw new Error( 'the stat relation ' + parent.relation.name + ' cannot have child relations.' );

  if ( typeof _with == "string" ) {

    var pos = _with.lastIndexOf( '.' );
    if ( pos != -1 ) {
      parent  = this.__build_join_tree( parent, _with.substr( 0, pos ) );
      _with   = _with.substr( pos + 1 );
    }

    // named scope
    var scopes;

    pos = _with.indexOf( ':' );
    if ( pos != -1 ) {
      scopes  = _with.substr( pos + 1 ).split( ':' );
      _with   = _with.substr( 0, pos );
    }

    if ( parent.children[ _with ] ) return parent.children[ _with ];

    
    var relation = parent.model.get_active_relation( _with );
    if ( relation == null ) throw new Error( 'Relation ' + _with + ' is not defined.' );

    relation = Object.clone( relation );
    var model = ActiveRecord.model( relation.class_name );
//    if ( (scope = model.default_scope()) !== array() )
//      relation.merge__with( scope );
//    if ( !empty( scopes ) ) {
//      scs = model.scopes();
//      foreach( scopes
//      as
//      scope
//    )
//      {
//        if ( isset( scs[scope] ) )
//          relation.merge__with( scs[scope] );
//        else
//          throw new cdb_exception( yii::t( 'yii', 'active record class "{class}" does not have a scope named "{scope}".',
//            array( '{class}' = > get_class( model ), '{scope}' = > scope )
//      ))
//        ;
//      }
//    }
//
//    // dynamic options
//    if ( options !== null )
//      relation.merge__with( options );
//
//    if ( relation instanceof cstat_relation )
//      return new cstat_element( this, relation, parent );
//    else {
//      element = parent.children[_with] = new cjoin_element( this, relation, parent, ++this._join_count );
//      if ( !empty( relation._with ) )
//        this.build_join_tree( element, relation._with );
//      return element;
//    }
//  }
//
//  // _with is an array, keys are relation name, values are relation spec
//  foreach( _with
//  as
//  key =
//>
//  value
//)
//  {
//    if ( typeof value == "string" )  // the value is a relation name
//      this.build_join_tree( parent, value );
//    else if ( typeof key == "string" && is_array( value ) )
//      element = this.build_join_tree( parent, key, value );
  }
}