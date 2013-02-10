var AppModule                 = autodafe.AppModule;
var DbCriteriaSelectedTables  = require('autodafe/framework/db/db_criteria_selected_tables');

module.exports = BaseActiveRelation.inherits( AppModule );

function BaseActiveRelation( params ) {
  this._init( params );
}


BaseActiveRelation.prototype._init = function( params ) {
  BaseActiveRelation.parent._init.call( this, params );

  if ( !params.name ) throw new Error(
    'Please specify name of relation in %s.init'.format( this.class_name )
  );
  this._.name       = params.name;

  if (!params.model) throw new Error(
    'Please specify correct model in %s.init'.format( this.class_name )
  );
  this._.model = params.model;

  if ( !params.foreign_key ) throw new Error(
    'Please specify `foreign_key` in %s.init'.format( this.class_name )
  );
  this._.foreign_key  = params.foreign_key;

  this.selected_tables = null;

  this._.select.set = function (value, descriptor) {
    this.selected_tables = new DbCriteriaSelectedTables(value);
  };

  this._.select.get = function () {
    return this.selected_tables.toString();
  };

  this.select         = '*';
  this.condition      = '';
  this.params         = {};
  this.group          = '';
  this.join           = '';
  this.having         = '';
  this.order          = '';

  for ( var name in params.options )
    this[ name ] = params.options[ name ];
};


BaseActiveRelation.prototype.get_options = function () {
  return {
    select    : this.select,
    condition : this.condition,
    params    : this.params,
    group     : this.group,
    join      : this.join,
    having    : this.having,
    order     : this.order
  }
};


BaseActiveRelation.prototype.copy = function () {
  return new this.constructor({
    app         : this.app,
    name        : this.name,
    model       : this.model,
    foreign_key : this.foreign_key,
    options     : this.get_options()
  });
};



BaseActiveRelation.prototype.merge_with = function (criteria/*, from_scope*/) {
  this.selected_tables.merge_with(criteria.selected_tables);

  if (criteria.condition && this.condition !== criteria.condition) {
    if (this.condition === '')
      this.condition = criteria.condition;
    else if (criteria.condition !== '')
      this.condition = "(%s) and (%s)".format(this.condition, criteria.condition);
  }

  if (criteria.params && this.params !== criteria.params)
    _.extend(this.params, criteria.params);

  if (criteria.order && this.order !== criteria.order) {
    if (this.order === '')
      this.order = criteria.order;
    else if (criteria.order !== '')
      this.order = criteria.order + ', ' + this.order;
  }

  if (criteria.group && this.group !== criteria.group) {
    if (this.group === '')
      this.group = criteria.group;
    else if (criteria.group !== '')
      this.group += ', ' + criteria.group;
  }

  if (criteria.join && this.join !== criteria.join) {
    if (this.join === '')
      this.join = criteria.join;
    else if (criteria.join !== '')
      this.join += ' ' + criteria.join;
  }

  if (criteria.having && this.having !== criteria.having) {
    if (this.having === '')
      this.having = criteria.having;
    else if (criteria.having !== '')
      this.having = "(" + this.having + ") AND (" + criteria.having + ")";
  }
};