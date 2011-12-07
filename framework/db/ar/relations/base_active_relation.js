var AppModule   = global.autodafe.AppModule;
var DbCriteria  = global.autodafe.db.Criteria;

module.exports = BaseActiveRelation.inherits( AppModule );

function BaseActiveRelation( params ) {
  this._init( params );
}


BaseActiveRelation.prototype._init = function( params ) {
  this.super_._init( params );

  if ( !params.name ) throw new Error(
    'Please specify name of relation in %s.init'.format( this.class_name )
  );
  this._.name       = params.name;

  var Model = global.autodafe.Model;
//  console.log( params.model.class_name );
//  console.log( params.model instanceof Model );
  // todo: вернуть проверку после ProxyHandler.get_proxy
  if ( !/*Model.is_instantiate(*/ params.model /*)*/ ) throw new Error(
    'Please specify correct model in %s.init'.format( this.class_name )
  );
  this._.model = params.model;

  if ( !params.foreign_key ) throw new Error(
    'Please specify `foreign_key` in %s.init'.format( this.class_name )
  );
  this._.foreign_key  = params.foreign_key;

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



BaseActiveRelation.prototype.merge_with = function( criteria/*, from_scope*/ ) {
  if ( criteria.select && this.select != criteria.select ) {
    if ( this.select == '*' )
      this.select = criteria.select;
    else if ( criteria.select != '*' ) {
      var select1 = typeof this.select == "string"      ? this.select.replace( /\s/g, '' ).split(',')     : this.select;
      var select2 = typeof criteria.select == "string"  ? criteria.select.replace( /\s/g, '' ).split(',') : criteria.select;
      this.select = select1.merge( select2 );
    }
  }

  if ( criteria.condition && this.condition !== criteria.condition ) {
    if ( this.condition === '' )
      this.condition = criteria.condition;
    else if ( criteria.condition !== '' )
      this.condition = "(%s) and (%s)".format( this.condition, criteria.condition );
  }

  if ( criteria.params && this.params !== criteria.params )
    this.params = Object.merge( this.params, criteria.params );

  if ( criteria.order && this.order !== criteria.order ) {
    if ( this.order === '' )
      this.order = criteria.order;
    else if ( criteria.order !== '' )
      this.order = criteria.order + ', ' + this.order;
  }

  if ( criteria.group && this.group !== criteria.group ) {
    if ( this.group === '' )
      this.group = criteria.group;
    else if ( criteria.group !== '' )
      this.group += ', ' + criteria.group;
  }

  if ( criteria.join && this.join !== criteria.join ) {
    if ( this.join === '' )
      this.join = criteria.join;
    else if ( criteria.join !== '' )
      this.join += ' ' + criteria.join;
  }

  if ( criteria.having && this.having !== criteria.having ) {
    if ( this.having === '' )
      this.having = criteria.having;
    else if ( criteria.having !== '' )
      this.having = "(" + this.having + ") " + and + " (" + criteria.having + ")";
  }
}