var DbCriteriaSelectedTables = require('autodafe/framework/db/db_criteria_selected_tables');
var _ = require('underscore');

module.exports = DbCriteria.inherits( autodafe.AutodafePart );


function DbCriteria( params ) {
  this._init( params );
}


DbCriteria.prototype._init = function( params ) {
  DbCriteria.parent._init.call( this, params );

  this.selected_tables = null;

  this._.select.set = function (value, descriptor) {
    this.selected_tables = new DbCriteriaSelectedTables(value);
  };

  this._.select.get = function () {
    return this.selected_tables.toString();
  };

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
  this.alias      = '';
  this.With       = null;
  this.together   = null;
  this.index      = null;

  for ( var param in params ) {
    this[ param ] = params[ param ];
  }
};


DbCriteria.prototype.clone = function () {
  return new this.constructor({
    select    : this.selected_tables,
    distinct  : this.distinct,
    condition : this.condition,
    params    : this.params,
    limit     : this.limit,
    offset    : this.offset,
    order     : this.order,
    group     : this.group,
    join      : this.join,
    having    : this.having,
    alias     : this.alias
  });
};


DbCriteria.prototype.merge_with = function (criteria, use_and) {
  var and = use_and || use_and == undefined ? 'AND' : 'OR';

  if (criteria instanceof this.constructor == false)
    criteria = new this.constructor(criteria);

  this.selected_tables.merge_with(criteria.selected_tables);

  if (this.condition !== criteria.condition) {
    if (this.condition === '')
      this.condition = criteria.condition;
    else if (criteria.condition !== '')
      this.condition = "(" + this.condition + ") " + and + " (" + criteria.condition + ")";
  }

  if (this.params !== criteria.params)
    _.extend(this.params, criteria.params);

  if (criteria.limit > 0)
    this.limit = criteria.limit;

  if (criteria.offset >= 0)
    this.offset = criteria.offset;

  if (criteria.alias !== null)
    this.alias = criteria.alias;

  if (this.order !== criteria.order) {
    if (this.order === '')
      this.order = criteria.order;
    else if (criteria.order !== '')
      this.order = criteria.order + ', ' + this.order;
  }

  if (this.group !== criteria.group) {
    if (this.group === '')
      this.group = criteria.group;
    else if (criteria.group !== '')
      this.group += ', ' + criteria.group;
  }

  if (this.join !== criteria.join) {
    if (this.join === '')
      this.join = criteria.join;
    else if (criteria.join !== '')
      this.join += ' ' + criteria.join;
  }

  if (this.having !== criteria.having) {
    if (this.having === '')
      this.having = criteria.having;
    else if (criteria.having !== '')
      this.having = "(" + this.having + ") " + and + " (" + criteria.having + ")";
  }

  if (criteria.distinct > 0)
    this.distinct = criteria.distinct;

  if (criteria.together != null) this.together = criteria.together;

  if (criteria.index != null)    this.index = criteria.index;

  if (!this.With)         this.With = criteria.With;
  else if (criteria.With) this.With = _.merge(this.With, criteria.With);
};