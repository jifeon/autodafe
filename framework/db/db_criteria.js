var DBCriteria = module.exports = function( params ) {
  this._init( params );
};


DBCriteria.prototype._init = function( params ) {
//  this.PARAM_PREFIX   = ':ycp';
//  this.__param_count  = 0;

  this.select     = '*';
  this.distinct   = false;
  this.condition  = '';
  this.params     = {};
  this.limit      = -1;
  this.offset     = -1;
  this.order      = '';
  this.group      = '';
  this.join       = '';
  this.having     = '';
  this._with      = null;
  this.alias      = '';

  for ( var param in params ) {
    this[ param ] = params[ param ];
  }
};

//
//DBCriteria.prototype.add_condition = function( condition, operator = 'and' ) {
//  if ( is_array( condition ) ) {
//    if ( condition === array() )
//      return this;
//    condition = '(' + implode( ') ' + operator + ' (', condition ) + ')';
//  }
//  if ( this.condition === '' )
//    this.condition = condition;
//  else
//    this.condition = '(' + this.condition + ') ' + operator + ' (' + condition + ')';
//  return this;
//}
//
//DBCriteria.prototype.add_search_condition = function( column, keyword, escape = true, operator = 'and', like = 'like' ) {
//  if ( escape )
//    keyword = '%' + strtr( keyword, array( '%' = > '\%', '_' = > '\_'
//))
//  +'%';
//  condition = column + " like " + self::param_prefix + this._param_count;
//  this.params[self::param_prefix + this._param_count++] = keyword;
//  return this.add_condition( condition, operator );
//}
//

//DBCriteria.prototype.add_incondition = function( column, values, operator = 'and' ) {
//  if ( (n = count( values )) < 1 )
//    return this.add_condition( '0=1', operator );
//  if ( n === 1 ) {
//    value = reset( values );
//    if ( value === null )
//      return this.add_condition( column + ' is null' );
//    condition = column + '=' + self::param_prefix + this._param_count;
//    this.params[self::param_prefix + this._param_count++] = value;
//  }
//  else {
//    params = array();
//    foreach( values
//    as
//    value
//  )
//    {
//      params[] = self::param_prefix + this._param_count;
//      this.params[self::param_prefix + this._param_count++] = value;
//    }
//    condition = column + ' in (' + implode( ', ', params ) + ')';
//  }
//  return this.add_condition( condition, operator );
//}
//

//DBCriteria.prototype.add_column_condition = function( columns, column_operator = 'and', operator = 'and' ) {
//  params = array();
//  foreach( columns
//  as
//  name =
//>
//  value
//)
//  {
//    if ( value === null )
//      params[] = name + ' is null';
//    else {
//      params[] = name + '=' + self::param_prefix + this._param_count;
//      this.params[self::param_prefix + this._param_count++] = value;
//    }
//  }
//  return this.add_condition( implode( " column_operator ", params ), operator );
//}
//

//DBCriteria.prototype.compare = function( column, value, partial_match = false, operator = 'and' ) {
//  if ( is_array( value ) ) {
//    if ( value === array() )
//      return this;
//    return this.add_incondition( column, value, operator );
//  }
//
//  if ( preg_match( '/^\s*(<>|<=|>=|<|>|=)?\s*(+*?)\s*/', value, matches ) ) {
//    value = matches[2];
//    op = matches[1];
//  }
//  else
//    op = '';
//
//  if ( value === '' )
//    return this;
//
//  if ( partial_match ) {
//    if ( op === '' )
//      return this.add_search_condition( column, value, true, operator );
//    if ( op === '<>' )
//      return this.add_search_condition( column, value, true, operator, 'not like' );
//  }
//  else if ( op === '' )
//    op = '=';
//
//  this.add_condition( "column{op}" + self::param_prefix + this._param_count, operator );
//  this.params[self::param_prefix + this._param_count++] = value;
//
//  return this;
//}


DBCriteria.prototype.merge_with = function( criteria, use_and ) {
  var and = use_and || use_and == undefined ? 'AND' : 'OR';

  if ( criteria instanceof Object ) criteria = new this.constructor( criteria );
  if ( this.select !== criteria.select ) {
    if ( this.select == '*' )
      this.select = criteria.select;
    else if ( criteria.select != '*' ) {
      var select1 = typeof this.select == "string"      ? this.select.replace( /\s/g, '' ).split(',')     : this.select;
      var select2 = typeof criteria.select == "string"  ? criteria.select.replace( /\s/g, '' ).split(',') : criteria.select;
      this.select = select1.merge( select2 );
    }
  }

  if ( this.condition !== criteria.condition ) {
    if ( this.condition === '' )
      this.condition = criteria.condition;
    else if ( criteria.condition !== '' )
      this.condition = "({this.condition}) " + and + " ({criteria.condition})";
  }

  if ( this.params !== criteria.params )
    this.params = Object.merge( this.params, criteria.params );

  if ( criteria.limit > 0 )
    this.limit = criteria.limit;

  if ( criteria.offset >= 0 )
    this.offset = criteria.offset;

  if ( criteria.alias !== null )
    this.alias = criteria.alias;

  if ( this.order !== criteria.order ) {
    if ( this.order === '' )
      this.order = criteria.order;
    else if ( criteria.order !== '' )
      this.order = criteria.order + ', ' + this.order;
  }

  if ( this.group !== criteria.group ) {
    if ( this.group === '' )
      this.group = criteria.group;
    else if ( criteria.group !== '' )
      this.group += ', ' + criteria.group;
  }

  if ( this.join !== criteria.join ) {
    if ( this.join === '' )
      this.join = criteria.join;
    else if ( criteria.join !== '' )
      this.join += ' ' + criteria.join;
  }

  if ( this.having !== criteria.having ) {
    if ( this.having === '' )
      this.having = criteria.having;
    else if ( criteria.having !== '' )
      this.having = "(" + this.having + ") " + and + " (" + criteria.having + ")";
  }

  if ( criteria.distinct > 0 )
    this.distinct = criteria.distinct;

  if ( Object.empty( this._with ) )           this._with = criteria._with;
  else if ( !Object.empty( criteria._with ) ) this._with = Object.recursive_merge( this._with,  criteria._with );
}


//DBCriteria.prototype.to_array = function() {
//  result = array();
//  foreach( array( 'select', 'condition', 'params', 'limit', 'offset', 'order', 'group', 'join', 'having', 'distinct', 'with', 'alias' )
//  as
//  name
//)
//  result[name] = this.name;
//  return result;
//}