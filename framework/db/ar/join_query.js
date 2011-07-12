var app_module = require('app_module');

module.exports = JoinQuery.inherits( app_module );

function JoinQuery( params ) {
  this._init( params );
}


JoinQuery.prototype._init = function( params ) {
  this.super_._init( params );

  this.join_all=false;
  this.base_limited=false;

  this.__join_count=0;
  this.__join_tree;
  this.__builder;
};




/**
 * cjoin_query represents a join sql statement.
 *
 * @author qiang xue <qiang.xue@gmail.com>
 * @version id: cactive_finder.php 2799 2011-01-01 19:31:13z qiang.xue
 * @package system.db.ar
 * @since 1.0
 */
class cjoin_query
{
  /**
   * @var array list of column selections
   */
  this.selects=array();
  /**
   * @var boolean whether to select distinct result set
   * @since 1.0.9
   */
  this.distinct=false;
  /**
   * @var array list of join statement
   */
  this.joins=array();
  /**
   * @var array list of where clauses
   */
  this.conditions=array();
  /**
   * @var array list of order by clauses
   */
  this.orders=array();
  /**
   * @var array list of group by clauses
   */
  this.groups=array();
  /**
   * @var array list of having clauses
   */
  this.havings=array();
  /**
   * @var integer row limit
   */
  this.limit=-1;
  /**
   * @var integer row offset
   */
  this.offset=-1;
  /**
   * @var array list of query parameters
   */
  this.params=array();
  /**
   * @var array list of join element ids (id=>true)
   */
  this.elements=array();

  /**
   * constructor.
   * @param cjoin_element join_element the root join tree.
   * @param cdb_criteria criteria the query criteria
   */
  JoinQuery.prototype.__construct = function(join_element,criteria=null)
  {
    if(criteria!==null)
    {
      this.selects[]=join_element.get_column_select(criteria.select);
      this.joins[]=join_element.get_table_name_with_alias();
      this.joins[]=criteria.join;
      this.conditions[]=criteria.condition;
      this.orders[]=criteria.order;
      this.groups[]=criteria.group;
      this.havings[]=criteria.having;
      this.limit=criteria.limit;
      this.offset=criteria.offset;
      this.params=criteria.params;
      if(!this.distinct && criteria.distinct)
        this.distinct=true;
    }
    else
    {
      this.selects[]=join_element.get_primary_key_select();
      this.joins[]=join_element.get_table_name_with_alias();
      this.conditions[]=join_element.get_primary_key_range();
    }
    this.elements[join_element.id]=true;
  }

  /**
   * joins with another join element
   * @param cjoin_element element the element to be joined
   */
  JoinQuery.prototype.join = function(element)
  {
    this.selects[]=element.get_column_select(element.relation.select);
    this.conditions[]=element.relation.condition;
    this.orders[]=element.relation.order;
    this.joins[]=element.get_join_condition();
    this.joins[]=element.relation.join;
    this.groups[]=element.relation.group;
    this.havings[]=element.relation.having;

    if(is_array(element.relation.params))
    {
      if(is_array(this.params))
        this.params=array_merge(this.params,element.relation.params);
      else
        this.params=element.relation.params;
    }
    this.elements[element.id]=true;
  }

  /**
   * creates the sql statement.
   * @param cdb_command_builder builder the command builder
   * @return string the sql statement
   */
  JoinQuery.prototype.create_command = function(builder)
  {
    sql=(this.distinct ? 'select distinct ':'select ') . implode(', ',this.selects);
    sql.=' from ' . implode(' ',this.joins);

    conditions=array();
    foreach(this.conditions as condition)
      if(condition!=='')
        conditions[]=condition;
    if(conditions!==array())
      sql.=' where (' . implode(') and (',conditions).')';

    groups=array();
    foreach(this.groups as group)
      if(group!=='')
        groups[]=group;
    if(groups!==array())
      sql.=' group by ' . implode(', ',groups);

    havings=array();
    foreach(this.havings as having)
      if(having!=='')
        havings[]=having;
    if(havings!==array())
      sql.=' having (' . implode(') and (',havings).')';

    orders=array();
    foreach(this.orders as order)
      if(order!=='')
        orders[]=order;
    if(orders!==array())
      sql.=' order by ' . implode(', ',orders);

    sql=builder.apply_limit(sql,this.limit,this.offset);
    command=builder.get_db_connection().create_command(sql);
    builder.bind_values(command,this.params);
    return command;
  }
}