var AppModule = require('app_module');

module.exports = JoinQuery.inherits( AppModule );

function JoinQuery( params ) {
  this._init( params );
}


JoinQuery.prototype._init = function( params ) {
  this.super_._init( params );

  var JoinElement = require( './join_element' );
  if ( !JoinElement.is_instantiate( params.join_element ) ) throw new Error(
    '`join_element` should be instance of JoinElement in JoinQuery.init'
  );
  this._.join_element = params.join_element;

  this.selects    = [];
  this.distinct   = false;
  this.joins      = [];
  this.conditions = [];
  this.orders     = [];
  this.groups     = [];
  this.havings    = [];
  this.limit      = -1;
  this.offset     = -1;
  this.params     = {};
  this.elements   = [];
  
//  if( params.criteria ) {
//    this.selects.push( this.join_element.get_column_select( params.criteria.select ) );
//    this.joins[]=join_element.get_table_name_with_alias();
//    this.joins[]=criteria.join;
//    this.conditions[]=criteria.condition;
//    this.orders[]=criteria.order;
//    this.groups[]=criteria.group;
//    this.havings[]=criteria.having;
//    this.limit=criteria.limit;
//    this.offset=criteria.offset;
//    this.params=criteria.params;
//    if(!this.distinct && criteria.distinct)
//      this.distinct=true;
//  }
//  else
//  {
    this.selects.push   ( this.join_element.get_primary_key_select()    );
    this.joins.push     ( this.join_element.get_table_name_with_alias() );
    this.conditions.push( this.join_element.get_primary_key_range()     );
//  }

  this.elements[ this.join_element.id ] = true;
};
//
//
//  /**
//   * joins with another join element
//   * @param cjoin_element element the element to be joined
//   */
//  JoinQuery.prototype.join = function(element)
//  {
//    this.selects[]=element.get_column_select(element.relation.select);
//    this.conditions[]=element.relation.condition;
//    this.orders[]=element.relation.order;
//    this.joins[]=element.get_join_condition();
//    this.joins[]=element.relation.join;
//    this.groups[]=element.relation.group;
//    this.havings[]=element.relation.having;
//
//    if(is_array(element.relation.params))
//    {
//      if(is_array(this.params))
//        this.params=array_merge(this.params,element.relation.params);
//      else
//        this.params=element.relation.params;
//    }
//    this.elements[element.id]=true;
//  }

JoinQuery.prototype.create_command = function( builder ){
  var sql = ( this.distinct ? 'SELECT DISTINCT ' : 'SELECT ' ) + this.selects.join(', ') +
            ' FROM ' + this.joins.join(' ');

  var conditions = this.conditions.filter( function( condition ) {
    return !!condition;
  } );

  if ( conditions.length ) sql += ' WHERE (' + conditions.join( ') AND (' ) + ')';

  var groups = this.groups.filter( function( group ){
    return !!group;
  } );

  if ( groups.length ) sql += ' GROUP BY ' + groups.join(', ');

  var havings = this.havings.filter( function( having ){
    return !!having;
  } );

  if( havings.length ) sql += ' HAVING (' + havings.join( ') and (' ) + ')';

  var orders = this.orders.filter( function( order ){
    return !!order;
  } );

  if ( orders.length ) sql += ' ORDER BY ' + orders.join(', ');

  sql = builder.apply_limit( sql, this.limit, this.offset );
  return builder.db_connection.create_command( sql ).bind_values( this.params );
}